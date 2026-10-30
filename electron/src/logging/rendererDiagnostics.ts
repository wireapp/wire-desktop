/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

export type RendererDiagnosticsLogger = {
  error(message: string): unknown;
  info(message: string): unknown;
};

export type RendererDiagnosticsWebContents = {
  getType(): string;
  on(
    event: 'console-message',
    listener: (
      details: Pick<Electron.WebContentsConsoleMessageEventParams, 'level' | 'lineNumber' | 'message'>,
    ) => void,
  ): unknown;
  on(event: 'preload-error', listener: (event: Electron.Event, preloadPath: string, error: Error) => void): unknown;
  on(
    event: 'did-fail-load',
    listener: (
      event: Electron.Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
      isMainFrame: boolean,
    ) => void,
  ): unknown;
  on(event: 'did-finish-load', listener: () => void): unknown;
  on(
    event: 'did-attach-webview',
    listener: (event: Electron.Event, webContents: Electron.WebContents) => void,
  ): unknown;
};

export type RendererDiagnosticsApp = {
  on(
    event: 'render-process-gone',
    listener: (
      event: Electron.Event,
      webContents: RendererDiagnosticsWebContents,
      details: Electron.RenderProcessGoneDetails,
    ) => void,
  ): unknown;
};

export type RegisterRendererDiagnosticsParameters = {
  app: RendererDiagnosticsApp;
  logger: RendererDiagnosticsLogger;
  reloadMainWindow(): void;
  reportReloadFailure(message: string): void;
  wrapperWebContents: RendererDiagnosticsWebContents;
};

const renderProcessGoneReasons: readonly string[] = [
  'clean-exit',
  'abnormal-exit',
  'killed',
  'crashed',
  'oom',
  'launch-failed',
  'integrity-failure',
  'memory-eviction',
];

type RendererProcessType = 'desktop-wrapper' | 'embedded-webview' | 'other';

function getRendererProcessType(
  wrapperWebContents: RendererDiagnosticsWebContents,
  rendererWebContents: RendererDiagnosticsWebContents,
): RendererProcessType {
  if (rendererWebContents === wrapperWebContents) {
    return 'desktop-wrapper';
  }

  if (rendererWebContents.getType() === 'webview') {
    return 'embedded-webview';
  }

  return 'other';
}

export function registerRendererDiagnostics(parameters: RegisterRendererDiagnosticsParameters): void {
  let hasLoadedInitialDocument = false;
  let hasLoggedWebViewAttachment = false;
  let hasLoggedInitialNavigationFailure = false;
  let hasLoggedRendererConsoleError = false;
  let hasLoggedPreloadError = false;

  parameters.wrapperWebContents.on('console-message', messageDetails => {
    if (messageDetails.level !== 'error' || hasLoggedRendererConsoleError) {
      return;
    }

    hasLoggedRendererConsoleError = true;
    const hasValidLineNumber = Number.isSafeInteger(messageDetails.lineNumber) && messageDetails.lineNumber > 0;
    const lineMetadata = hasValidLineNumber ? ` line=${messageDetails.lineNumber}` : '';
    parameters.logger.error(`event=desktop-wrapper-console-error severity=error${lineMetadata}`);
  });

  parameters.wrapperWebContents.on('preload-error', () => {
    if (hasLoggedPreloadError) {
      return;
    }

    hasLoggedPreloadError = true;
    parameters.logger.error('event=desktop-wrapper-preload-error severity=error');
  });

  parameters.wrapperWebContents.on(
    'did-fail-load',
    (_event, errorCode, _errorDescription, _validatedURL, isMainFrame) => {
      if (hasLoadedInitialDocument || hasLoggedInitialNavigationFailure || !isMainFrame || errorCode === -3) {
        return;
      }

      hasLoggedInitialNavigationFailure = true;
      const hasValidErrorCode = Number.isSafeInteger(errorCode);
      const errorCodeMetadata = hasValidErrorCode ? ` errorCode=${errorCode}` : '';
      parameters.logger.error(`event=desktop-wrapper-initial-navigation-failed severity=error${errorCodeMetadata}`);
    },
  );

  parameters.wrapperWebContents.on('did-finish-load', () => {
    if (hasLoadedInitialDocument) {
      return;
    }

    hasLoadedInitialDocument = true;
    parameters.logger.info('Desktop wrapper renderer loaded its initial document.');
  });

  parameters.wrapperWebContents.on('did-attach-webview', () => {
    if (hasLoggedWebViewAttachment) {
      return;
    }

    hasLoggedWebViewAttachment = true;
    parameters.logger.info('Desktop wrapper attached an embedded WebView.');
  });

  parameters.app.on('render-process-gone', (_event, rendererWebContents, details) => {
    const rendererProcessType = getRendererProcessType(parameters.wrapperWebContents, rendererWebContents);
    const reason = renderProcessGoneReasons.includes(details.reason) ? details.reason : 'unknown';
    const exitCode = Number.isSafeInteger(details.exitCode) ? details.exitCode : 'unknown';
    parameters.logger.error(
      `event=${rendererProcessType}-process-terminated severity=error reason=${reason} exitCode=${exitCode}`,
    );

    try {
      parameters.reloadMainWindow();
    } catch {
      parameters.logger.error('event=desktop-window-reload-failed severity=error');
      parameters.reportReloadFailure('The desktop window could not reload after a renderer process failure.');
    }
  });
}
