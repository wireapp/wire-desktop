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

import {app} from 'electron';

import * as os from 'os';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger('AuthFlowConfig');

export enum AuthFlowType {
  EMBEDDED_WINDOW = 'embedded_window',
  EXTERNAL_BROWSER = 'external_browser',
}

export enum AuthProvider {
  SSO = 'sso',
  SAML = 'saml',
  ENSIGN_IDENTITY = 'ensign_identity',
  OAUTH = 'oauth',
}

export interface AuthFlowConfiguration {
  provider: AuthProvider;
  flowType: AuthFlowType;
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  allowedOrigins: string[];
  timeout: number;
  enableContextIsolation: boolean;
  enableSandbox: boolean;
  requireExternalBrowser: boolean;
}

export class AuthFlowConfig {
  private static readonly DEFAULT_TIMEOUT = 300000; // 5 minutes
  private static readonly ENHANCED_TIMEOUT = 180000; // 3 minutes
  private static readonly MAXIMUM_TIMEOUT = 120000; // 2 minutes

  /**
   * Gets the recommended authentication flow configuration for a provider
   * @param {AuthProvider} provider The authentication provider
   * @returns {AuthFlowConfiguration} The flow configuration for the provider
   */
  static getFlowConfig(provider: AuthProvider): AuthFlowConfiguration {
    const baseConfig = {
      provider,
      allowedOrigins: config.backendOrigins,
      enableContextIsolation: true,
      enableSandbox: true,
      requireExternalBrowser: false,
    };

    switch (provider) {
      case AuthProvider.SSO:
      case AuthProvider.SAML:
        return {
          ...baseConfig,
          flowType: AuthFlowType.EMBEDDED_WINDOW,
          securityLevel: 'enhanced',
          timeout: this.ENHANCED_TIMEOUT,
        };

      case AuthProvider.ENSIGN_IDENTITY:
        return {
          ...baseConfig,
          flowType: AuthFlowType.EMBEDDED_WINDOW,
          securityLevel: 'maximum',
          timeout: this.MAXIMUM_TIMEOUT,
          requireExternalBrowser: true, // High-security provider
        };

      case AuthProvider.OAUTH:
        return {
          ...baseConfig,
          flowType: AuthFlowType.EXTERNAL_BROWSER,
          securityLevel: 'standard',
          timeout: this.DEFAULT_TIMEOUT,
        };

      default:
        logger.warn(`Unknown auth provider: ${provider}, using default config`);
        return {
          ...baseConfig,
          flowType: AuthFlowType.EMBEDDED_WINDOW,
          securityLevel: 'standard',
          timeout: this.DEFAULT_TIMEOUT,
        };
    }
  }

  /**
   * Determines if external browser should be used based on security requirements
   * @param {AuthProvider} provider The authentication provider
   * @returns {boolean} True if external browser should be used
   */
  static shouldUseExternalBrowser(provider: AuthProvider): boolean {
    const config = this.getFlowConfig(provider);

    if (config.securityLevel === 'maximum' || config.requireExternalBrowser) {
      return true;
    }

    const forceExternal = process.env.WIRE_FORCE_EXTERNAL_AUTH === 'true';
    if (forceExternal) {
      logger.log(`Forcing external browser for ${provider} due to environment setting`);
      return true;
    }

    return false;
  }

  /**
   * Gets security-enhanced window options for embedded authentication
   * @param {AuthProvider} provider The authentication provider
   * @returns {Electron.BrowserWindowConstructorOptions} Secure window options
   */
  static getSecureWindowOptions(provider: AuthProvider): Electron.BrowserWindowConstructorOptions {
    const config = this.getFlowConfig(provider);

    const baseOptions: Electron.BrowserWindowConstructorOptions = {
      width: 480,
      height: 600,
      show: false,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      webPreferences: {
        contextIsolation: config.enableContextIsolation,
        sandbox: config.enableSandbox,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        plugins: false,
        webviewTag: false,
        devTools: false,
      },
    };

    if (config.securityLevel === 'enhanced' || config.securityLevel === 'maximum') {
      baseOptions.webPreferences = {
        ...baseOptions.webPreferences,
        partition: `auth-${provider}-${Date.now()}`,
        spellcheck: false,
        backgroundThrottling: false,
      };
    }

    return baseOptions;
  }

  /**
   * Validates if a URL is allowed for the given auth provider
   * @param {string} url The URL to validate
   * @param {AuthProvider} provider The authentication provider
   * @returns {boolean} True if the URL is allowed
   */
  static isUrlAllowed(url: string, provider: AuthProvider): boolean {
    const config = this.getFlowConfig(provider);

    try {
      const urlObj = new URL(url);
      const origin = urlObj.origin;

      return config.allowedOrigins.includes(origin);
    } catch (error) {
      logger.error(`Invalid URL for ${provider}: ${url}`, error);
      return false;
    }
  }

  /**
   * Gets the callback URL for external browser authentication
   * @param {AuthProvider} provider The authentication provider
   * @returns {string} The callback URL for the provider
   */
  static getCallbackUrl(provider: AuthProvider): string {
    return `${config.customProtocolName}-auth://callback/${provider}`;
  }

  /**
   * Logs the current authentication flow configuration
   * @returns {void}
   */
  static logCurrentConfig(): void {
    const providers = Object.values(AuthProvider);

    logger.log('Current authentication flow configuration:');
    providers.forEach(provider => {
      const config = this.getFlowConfig(provider);
      const useExternal = this.shouldUseExternalBrowser(provider);

      logger.log(`  ${provider}:`);
      logger.log(`    Flow Type: ${useExternal ? 'External Browser' : 'Embedded Window'}`);
      logger.log(`    Security Level: ${config.securityLevel}`);
      logger.log(`    Timeout: ${config.timeout}ms`);
      logger.log(`    Context Isolation: ${config.enableContextIsolation}`);
      logger.log(`    Sandbox: ${config.enableSandbox}`);
    });
  }

  /**
   * Checks if the current environment supports external browser authentication
   * @returns {boolean} True if external browser authentication is supported
   */
  static isExternalBrowserSupported(): boolean {
    try {
      const canRegister = typeof app.setAsDefaultProtocolClient === 'function';

      if (!canRegister) {
        logger.warn('Protocol registration not supported on this platform');
        return false;
      }

      const platform = os.platform();

      switch (platform) {
        case 'win32':
          return true;

        case 'darwin':
          return true;

        case 'linux': {
          const hasDesktopEnv =
            process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || process.env.GNOME_DESKTOP_SESSION_ID;

          if (!hasDesktopEnv) {
            logger.warn('Linux desktop environment not detected, protocol registration may not work');
            return false;
          }
          return true;
        }

        default:
          logger.warn(`Unsupported platform for protocol registration: ${platform}`);
          return false;
      }
    } catch (error) {
      logger.error('Error checking external browser support:', error);
      return false;
    }
  }

  /**
   * Gets migration status for each auth provider
   * @returns {Record<AuthProvider, Object>} Migration status for each provider
   */
  static getMigrationStatus(): Record<AuthProvider, {migrated: boolean; reason?: string}> {
    return {
      [AuthProvider.SSO]: {
        migrated: false,
        reason: 'Enhanced security implemented, external browser migration available',
      },
      [AuthProvider.SAML]: {
        migrated: false,
        reason: 'Enhanced security implemented, external browser migration available',
      },
      [AuthProvider.ENSIGN_IDENTITY]: {
        migrated: false,
        reason: 'Enhanced security implemented, external browser migration ready for high-security requirements',
      },
      [AuthProvider.OAUTH]: {
        migrated: true,
        reason: 'Already using external browser',
      },
    };
  }
}
