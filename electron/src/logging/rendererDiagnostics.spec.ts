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

import {EventEmitter} from 'events';

import {
  registerRendererDiagnostics,
  RendererDiagnosticsApp,
  RendererDiagnosticsLogger,
  RendererDiagnosticsWebContents,
} from './rendererDiagnostics';
import {createWebViewConsoleLogger} from './webViewConsoleLogger';

type FakeWebContents = EventEmitter & {
  getType(): string;
};

function createFakeWebContents(contentType: string): FakeWebContents {
  return Object.assign(new EventEmitter(), {
    getType(): string {
      return contentType;
    },
  });
}

type RendererDiagnosticsFixture = {
  appEvents: EventEmitter;
  errors: string[];
  infos: string[];
  reloadFailureMessages: string[];
  reloadCount(): number;
  wrapperWebContents: FakeWebContents;
};

type RendererDiagnosticsFixtureParameters = {
  reloadMainWindow?(): void;
};

function createRendererDiagnosticsFixture(
  parameters: RendererDiagnosticsFixtureParameters = {},
): RendererDiagnosticsFixture {
  const appEvents = new EventEmitter();
  const wrapperWebContents = createFakeWebContents('window');
  const errors: string[] = [];
  const infos: string[] = [];
  const reloadFailureMessages: string[] = [];
  let mainWindowReloadCount = 0;
  const logger: RendererDiagnosticsLogger = {
    error(message: string): void {
      errors.push(message);
    },
    info(message: string): void {
      infos.push(message);
    },
  };

  registerRendererDiagnostics({
    app: appEvents as unknown as RendererDiagnosticsApp,
    logger,
    reloadMainWindow(): void {
      mainWindowReloadCount += 1;
      parameters.reloadMainWindow?.();
    },
    reportReloadFailure(message: string): void {
      reloadFailureMessages.push(message);
    },
    wrapperWebContents: wrapperWebContents as unknown as RendererDiagnosticsWebContents,
  });

  return {
    appEvents,
    errors,
    infos,
    reloadFailureMessages,
    reloadCount: (): number => mainWindowReloadCount,
    wrapperWebContents,
  };
}

describe('desktop renderer diagnostics', () => {
  it('records the wrapper error category and line without persisting message contents', () => {
    const fixture = createRendererDiagnosticsFixture();
    const arbitraryMessage =
      'OIDC payload for Alice: session-private-value https://customer.example.test/callback?state=private-state';
    const sourcePath = '/Users/person/private/preload.js';

    fixture.wrapperWebContents.emit('console-message', {
      level: 'error',
      lineNumber: 37,
      message: `${arbitraryMessage} ${sourcePath}`,
    });
    fixture.wrapperWebContents.emit('console-message', {
      level: 'error',
      lineNumber: 38,
      message: 'A second renderer error with unrelated contents',
    });

    expect(fixture.errors).toEqual(['event=desktop-wrapper-console-error severity=error line=37']);
    expect(fixture.errors.join('\n')).not.toContain(arbitraryMessage);
    expect(fixture.errors.join('\n')).not.toContain(sourcePath);
    expect(fixture.errors.join('\n')).not.toContain('private-state');
    expect(fixture.errors.join('\n')).not.toContain('customer.example.test');
  });

  it('logs startup milestones once and ignores ordinary renderer messages', () => {
    const fixture = createRendererDiagnosticsFixture();

    fixture.wrapperWebContents.emit('console-message', {level: 'info', lineNumber: 1, message: 'startup info'});
    fixture.wrapperWebContents.emit('console-message', {level: 'warning', lineNumber: 2, message: 'startup warning'});
    fixture.wrapperWebContents.emit('did-finish-load');
    fixture.wrapperWebContents.emit('did-finish-load');
    fixture.wrapperWebContents.emit('did-attach-webview', {}, createFakeWebContents('webview'));
    fixture.wrapperWebContents.emit('did-attach-webview', {}, createFakeWebContents('webview'));

    expect(fixture.errors).toEqual([]);
    expect(fixture.infos).toEqual([
      'Desktop wrapper renderer loaded its initial document.',
      'Desktop wrapper attached an embedded WebView.',
    ]);
    expect(fixture.wrapperWebContents.listenerCount('console-message')).toBe(1);
    expect(fixture.wrapperWebContents.listenerCount('did-fail-load')).toBe(1);
    expect(fixture.appEvents.listenerCount('render-process-gone')).toBe(1);
  });

  it('records preload and initial navigation stages without exception or URL contents', () => {
    const fixture = createRendererDiagnosticsFixture();
    const preloadMessage = 'Identity provider response included private-session-value';
    const navigationDescription = 'Cannot reach https://private.example.test/?code=private-code';
    const preloadPath = '/Users/person/private/preload.js';

    fixture.wrapperWebContents.emit('preload-error', {}, preloadPath, new Error(preloadMessage));
    fixture.wrapperWebContents.emit('preload-error', {}, '/another/private/preload.js', new Error('Another failure'));
    fixture.wrapperWebContents.emit(
      'did-fail-load',
      {},
      -105,
      navigationDescription,
      'https://private.example.test/?code=private-code',
      true,
    );
    fixture.wrapperWebContents.emit(
      'did-fail-load',
      {},
      -105,
      'Subframe failure',
      'https://private.example.test',
      false,
    );
    fixture.wrapperWebContents.emit(
      'did-fail-load',
      {},
      -3,
      'Navigation cancelled',
      'file:///renderer/index.html',
      true,
    );
    fixture.wrapperWebContents.emit('did-finish-load');
    fixture.wrapperWebContents.emit(
      'did-fail-load',
      {},
      -105,
      'Later navigation failure',
      'file:///renderer/index.html',
      true,
    );

    expect(fixture.errors).toEqual([
      'event=desktop-wrapper-preload-error severity=error',
      'event=desktop-wrapper-initial-navigation-failed severity=error errorCode=-105',
    ]);
    expect(fixture.errors.join('\n')).not.toContain(preloadMessage);
    expect(fixture.errors.join('\n')).not.toContain(navigationDescription);
    expect(fixture.errors.join('\n')).not.toContain(preloadPath);
    expect(fixture.errors.join('\n')).not.toContain('private.example.test');
    expect(fixture.errors.join('\n')).not.toContain('private-code');
  });

  it('distinguishes wrapper and embedded renderer termination without duplicate crash entries', () => {
    const fixture = createRendererDiagnosticsFixture();
    const embeddedWebView = createFakeWebContents('webview');
    const crashDetails: Electron.RenderProcessGoneDetails = {exitCode: 9, reason: 'crashed'};

    fixture.appEvents.emit('render-process-gone', {}, fixture.wrapperWebContents, crashDetails);
    fixture.appEvents.emit('render-process-gone', {}, embeddedWebView, crashDetails);

    expect(fixture.errors).toEqual([
      'event=desktop-wrapper-process-terminated severity=error reason=crashed exitCode=9',
      'event=embedded-webview-process-terminated severity=error reason=crashed exitCode=9',
    ]);
    expect(fixture.reloadCount()).toBe(2);
  });

  it('reports reload failures without persisting exception descriptions', () => {
    const privateExceptionMessage =
      'The wrapper failed while reading /Users/person/private/state.json for Alice session-private-value';
    const fixture = createRendererDiagnosticsFixture({
      reloadMainWindow(): void {
        throw new Error(privateExceptionMessage);
      },
    });

    fixture.appEvents.emit('render-process-gone', {}, fixture.wrapperWebContents, {
      exitCode: 9,
      reason: 'crashed',
    });

    expect(fixture.errors).toEqual([
      'event=desktop-wrapper-process-terminated severity=error reason=crashed exitCode=9',
      'event=desktop-window-reload-failed severity=error',
    ]);
    expect(fixture.errors.join('\n')).not.toContain(privateExceptionMessage);
    expect(fixture.errors.join('\n')).not.toContain('/Users/person/private/state.json');
    expect(fixture.errors.join('\n')).not.toContain('session-private-value');
    expect(fixture.reloadFailureMessages).toEqual([
      'The desktop window could not reload after a renderer process failure.',
    ]);
  });

  it('preserves account WebView console logging and access-token filtering', async () => {
    const writtenMessages: Array<{logFilePath: string; message: string}> = [];
    const logAccountConsoleMessage = createWebViewConsoleLogger({
      getAccountId: (): string => 'account-123',
      getLogFilePath(accountId: string): string {
        return `/logs/accounts/${accountId}/console.log`;
      },
      reportWriteFailure(): void {
        throw new Error('Unexpected console log write failure');
      },
      async writeLogMessage(logFilePath: string, message: string): Promise<void> {
        writtenMessages.push({logFilePath, message});
      },
    });

    await logAccountConsoleMessage({
      message: '%cWebApp warning%c color:#fff; font-weight:bold; access_token=private-token',
    });

    expect(writtenMessages).toEqual([
      {
        logFilePath: '/logs/accounts/account-123/console.log',
        message: 'WebApp warning ',
      },
    ]);
  });
});
