/*
 * Wire
 * Copyright (C) 2024 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {app, shell} from 'electron';

import * as crypto from 'crypto';
import {URL} from 'url';

import {getLogger} from '../logging/getLogger';
import {OriginValidator} from '../runtime/OriginValidator';
import {config} from '../settings/config';

const logger = getLogger('ExternalBrowserAuth');

export interface ExternalAuthConfig {
  authUrl: string;
  callbackUrl: string;
  timeout?: number;
  allowedOrigins?: string[];
}

export interface ExternalAuthResult {
  success: boolean;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}

/**
 * Handles authentication flows using external browser windows
 * This provides a more secure alternative to embedded browser windows
 */
export class ExternalBrowserAuth {
  private static readonly DEFAULT_TIMEOUT = 300000; // 5 minutes
  private static readonly CALLBACK_PROTOCOL = `${config.customProtocolName}-auth`;
  private static readonly STATE_LENGTH = 32;
  private static instance: ExternalBrowserAuth | null = null;

  private authState: string | null = null;
  private authPromise: Promise<ExternalAuthResult> | null = null;
  private authResolve: ((result: ExternalAuthResult) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  /**
   * Gets the singleton instance of ExternalBrowserAuth
   * @returns {ExternalBrowserAuth} The singleton instance
   */
  static getInstance(): ExternalBrowserAuth {
    ExternalBrowserAuth.instance ??= new ExternalBrowserAuth();
    return ExternalBrowserAuth.instance;
  }

  /**
   * Initiates an external browser authentication flow
   * @param {ExternalAuthConfig} config The authentication configuration
   * @returns {Promise<ExternalAuthResult>} Promise resolving to authentication result
   */
  async authenticate(config: ExternalAuthConfig): Promise<ExternalAuthResult> {
    if (this.authPromise) {
      throw new Error('Authentication already in progress');
    }

    const urlValidation = OriginValidator.validateSSORedirectURL(config.authUrl, config.allowedOrigins || []);

    if (!urlValidation.isValid) {
      throw new Error(`Invalid auth URL: ${urlValidation.reason}`);
    }

    this.authState = this.generateSecureState();

    const authUrl = this.buildAuthUrl(config.authUrl, config.callbackUrl, this.authState);

    logger.log(`Starting external browser authentication to: ${authUrl}`);

    this.authPromise = new Promise<ExternalAuthResult>(resolve => {
      this.authResolve = resolve;
    });

    const timeout = config.timeout || ExternalBrowserAuth.DEFAULT_TIMEOUT;
    this.timeoutId = setTimeout(() => {
      this.handleAuthTimeout();
    }, timeout);

    try {
      await shell.openExternal(authUrl);

      return await this.authPromise;
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Handles the callback from the external browser
   * @param {string} callbackUrl The callback URL from the browser
   * @returns {boolean} True if the callback was handled
   */
  handleCallback(callbackUrl: string): boolean {
    if (!this.authPromise || !this.authState) {
      logger.warn('Received callback but no authentication in progress');
      return false;
    }

    try {
      const url = new URL(callbackUrl);
      const params = new URLSearchParams(url.search);

      const receivedState = params.get('state');
      if (receivedState !== this.authState) {
        this.resolveAuth({
          success: false,
          error: 'invalid_state',
          errorDescription: 'State parameter mismatch',
        });
        return true;
      }

      const error = params.get('error');
      if (error) {
        this.resolveAuth({
          success: false,
          error,
          errorDescription: params.get('error_description') || undefined,
        });
        return true;
      }

      const code = params.get('code');
      if (code) {
        this.resolveAuth({
          success: true,
          code,
          state: receivedState,
        });
        return true;
      }

      this.resolveAuth({
        success: false,
        error: 'invalid_callback',
        errorDescription: 'No authorization code or error in callback',
      });
      return true;
    } catch (error) {
      logger.error('Error parsing callback URL:', error);
      this.resolveAuth({
        success: false,
        error: 'callback_parse_error',
        errorDescription: 'Failed to parse callback URL',
      });
      return true;
    }
  }

  /**
   * Cancels the current authentication flow
   * @returns {void}
   */
  cancel(): void {
    if (this.authPromise) {
      this.resolveAuth({
        success: false,
        error: 'user_cancelled',
        errorDescription: 'Authentication cancelled by user',
      });
    }
  }

  /**
   * Checks if authentication is currently in progress
   * @returns {boolean} True if authentication is in progress
   */
  isAuthInProgress(): boolean {
    return this.authPromise !== null;
  }

  private generateSecureState(): string {
    return crypto.randomBytes(ExternalBrowserAuth.STATE_LENGTH).toString('hex');
  }

  private buildAuthUrl(baseUrl: string, callbackUrl: string, state: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', 'code');
    return url.toString();
  }

  private handleAuthTimeout(): void {
    logger.warn('Authentication timeout');
    this.resolveAuth({
      success: false,
      error: 'timeout',
      errorDescription: 'Authentication timed out',
    });
  }

  private resolveAuth(result: ExternalAuthResult): void {
    if (this.authResolve) {
      this.authResolve(result);
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.authPromise = null;
    this.authResolve = null;
    this.authState = null;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Handles incoming protocol URLs from the system
   * @param {string} url The protocol URL received
   * @returns {boolean} True if the URL was handled
   */
  static handleProtocolUrl(url: string): boolean {
    const instance = ExternalBrowserAuth.getInstance();
    return instance.handleCallback(url);
  }

  /**
   * Registers the custom protocol handler for auth callbacks
   * @returns {boolean} True if protocol handler was registered successfully
   */
  static registerProtocolHandler(): boolean {
    try {
      const protocol = ExternalBrowserAuth.CALLBACK_PROTOCOL;

      if (!protocol || protocol.length === 0) {
        logger.error('Invalid protocol name for registration');
        return false;
      }

      if (app.isDefaultProtocolClient(protocol)) {
        logger.log(`Protocol ${protocol} is already registered`);
        return true;
      }

      const success = app.setAsDefaultProtocolClient(protocol);

      if (success) {
        logger.log(`Successfully registered protocol handler for ${protocol}`);

        const isRegistered = app.isDefaultProtocolClient(protocol);
        if (!isRegistered) {
          logger.warn(`Protocol registration reported success but verification failed for ${protocol}`);
          return false;
        }
      } else {
        logger.error(`Failed to register protocol handler for ${protocol}`);
      }

      return success;
    } catch (error) {
      logger.error('Failed to register protocol handler:', error);
      return false;
    }
  }

  /**
   * Unregisters the custom protocol handler
   * @returns {boolean} True if protocol handler was unregistered successfully
   */
  static unregisterProtocolHandler(): boolean {
    try {
      const protocol = ExternalBrowserAuth.CALLBACK_PROTOCOL;

      if (!protocol || protocol.length === 0) {
        logger.error('Invalid protocol name for unregistration');
        return false;
      }

      if (!app.isDefaultProtocolClient(protocol)) {
        logger.log(`Protocol ${protocol} is not registered`);
        return true;
      }

      const success = app.removeAsDefaultProtocolClient(protocol);

      if (success) {
        logger.log(`Successfully unregistered protocol handler for ${protocol}`);

        const isStillRegistered = app.isDefaultProtocolClient(protocol);
        if (isStillRegistered) {
          logger.warn(`Protocol unregistration reported success but verification failed for ${protocol}`);
          return false;
        }
      } else {
        logger.error(`Failed to unregister protocol handler for ${protocol}`);
      }

      return success;
    } catch (error) {
      logger.error('Failed to unregister protocol handler:', error);
      return false;
    }
  }
}
