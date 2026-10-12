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

import {app, BrowserWindow, ipcMain, WebContents} from 'electron';
import {Maybe} from 'true-myth';

import * as assert from 'assert';
import * as http from 'http';
import * as path from 'path';

import * as OriginValidator from './OriginValidator';
import type {NavigationEvent, NavigationOrigins} from './OriginValidator';
import {
  navigateWebviewDestination,
  registerNavigationEventHandlers,
  type NavigationDecision,
} from './WebviewNavigation';

type TestHttpServer = {
  origin: string;
  server: http.Server;
};

type FindBlockedNavigationDecisionParameters = {
  decisions: NavigationDecision[];
  destinationOrigin: string;
  kind: NavigationDecision['kind'];
};

async function startTestHttpServer(requestListener: http.RequestListener): Promise<TestHttpServer> {
  const server = http.createServer(requestListener);
  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('The test HTTP server did not bind to a TCP port');
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    server,
  };
}

async function closeTestHttpServer(server: http.Server): Promise<void> {
  await new Promise<void>(resolve => {
    server.close(() => resolve());
  });
}

function findBlockedNavigationDecision(parameters: FindBlockedNavigationDecisionParameters): Maybe<NavigationDecision> {
  for (const decision of parameters.decisions) {
    if (
      !decision.allowed &&
      decision.destinationOrigin === parameters.destinationOrigin &&
      decision.kind === parameters.kind
    ) {
      return Maybe.just(decision);
    }
  }

  return Maybe.nothing<NavigationDecision>();
}

async function waitFor<T>(readValue: () => Maybe<T>): Promise<T> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const value = readValue();
    if (value.isJust) {
      return value.value;
    }
    await new Promise(resolve => setTimeout(resolve, 20));
  }

  throw new Error('Timed out waiting for Electron WebView navigation');
}

async function getDocumentOrigin(webviewContents: WebContents): Promise<string> {
  return await webviewContents.executeJavaScript('window.location.origin');
}

describe('WebviewNavigation Electron integration', function () {
  this.timeout(30000);

  it('enforces origin policy in a privileged WebView with local HTTP origins', async () => {
    const attackerRequests: string[] = [];
    const preloadOrigins: string[] = [];
    const decisions: NavigationDecision[] = [];
    const accountId = 'ea4c1fd2-06b6-4a0b-a964-118f85e29911';
    const root = path.resolve(__dirname, '../../..');
    const preloadPath = path.join(root, 'electron/test/fixtures/navigation-preload.js');
    let attackerOrigin = '';
    let trustedOrigin = '';
    let navigationOrigins: NavigationOrigins = {
      pendingOrigin: Maybe.nothing<string>(),
      trustedOrigin: Maybe.nothing<string>(),
    };
    let resolveGuest: (webviewContents: WebContents) => void = () => {};
    let resolveGuestLoad: () => void = () => {};
    const guestCreated = new Promise<WebContents>(resolve => {
      resolveGuest = resolve;
    });
    const guestLoaded = new Promise<void>(resolve => {
      resolveGuestLoad = resolve;
    });
    const createdGuestContents: WebContents[] = [];
    let browserWindow: BrowserWindow | null = null;
    let attachedGuestCount = 0;

    const attackerServer = await startTestHttpServer((request, response) => {
      attackerRequests.push(typeof request.url === 'string' ? request.url : '');
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end('<!doctype html><title>attacker</title><script>window.__attackerDocumentExecuted = true;</script>');
    });
    attackerOrigin = attackerServer.origin;

    const trustedServer = await startTestHttpServer((request, response) => {
      const requestUrl = new URL(typeof request.url === 'string' ? request.url : '/', trustedOrigin);
      if (requestUrl.pathname === '/wrapper') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(
          `<!doctype html><webview id="account" src="${trustedOrigin}/initial?id=${accountId}"></webview><webview id="untrusted" src="${attackerOrigin}/initial?id=${accountId}"></webview>`,
        );
        return;
      }

      if (requestUrl.pathname === '/redirect') {
        response.writeHead(302, {Location: `${attackerOrigin}/redirected`});
        response.end();
        return;
      }

      if (requestUrl.pathname === '/meta-refresh') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(
          `<!doctype html><meta http-equiv="refresh" content="0;url=${attackerOrigin}/stage2/"><title>trusted</title>`,
        );
        return;
      }

      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end('<!doctype html><title>trusted</title>');
    });
    trustedOrigin = trustedServer.origin;
    navigationOrigins = {
      pendingOrigin: Maybe.nothing<string>(),
      trustedOrigin: Maybe.just(trustedOrigin),
    };

    function onPrivilegedPreload(_event: Electron.IpcMainEvent, origin: string): void {
      preloadOrigins.push(origin);
    }

    function onWebContentsCreated(_event: Electron.Event, contents: WebContents): void {
      if (contents.getType() !== 'webview') {
        return;
      }

      createdGuestContents.push(contents);
      registerNavigationEventHandlers({
        getNavigationOrigins() {
          return navigationOrigins;
        },
        logNavigationDecision(decision) {
          decisions.push(decision);
        },
        onWillNavigate(listener: (event: NavigationEvent, destinationUrl: string) => void) {
          contents.on('will-navigate', listener);
        },
        onWillRedirect(
          listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
        ) {
          contents.on('will-redirect', listener);
        },
      });
      contents.once('did-finish-load', resolveGuestLoad);
      resolveGuest(contents);
    }

    ipcMain.on('test:privileged-preload', onPrivilegedPreload);
    app.on('web-contents-created', onWebContentsCreated);

    try {
      browserWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          webviewTag: true,
        },
      });
      browserWindow.webContents.on('did-attach-webview', () => {
        attachedGuestCount += 1;
      });
      browserWindow.webContents.on('will-attach-webview', (event, webPreferences, parameters) => {
        const initialUrl = typeof parameters.src === 'string' ? parameters.src : '';
        if (!OriginValidator.isMatchingOrigin(initialUrl, Maybe.just(trustedOrigin))) {
          event.preventDefault();
          return;
        }

        webPreferences.contextIsolation = false;
        webPreferences.nodeIntegration = false;
        webPreferences.preload = preloadPath;
        webPreferences.sandbox = false;
      });

      await browserWindow.loadURL(`${trustedOrigin}/wrapper`);
      const webviewContents = await guestCreated;
      await guestLoaded;

      assert.strictEqual(attachedGuestCount, 1);
      assert.strictEqual(attackerRequests.length, 0);
      await waitFor(() => {
        if (preloadOrigins.includes(trustedOrigin)) {
          return Maybe.just(trustedOrigin);
        }

        return Maybe.nothing<string>();
      });
      assert.strictEqual(preloadOrigins.includes(attackerOrigin), false);

      let currentTrustedOrigin = trustedOrigin;
      const programmaticLoadAttempts: string[] = [];
      const navigateGuestToUrl = async function navigateGuestToUrl(
        destinationUrl: string,
        approveCrossOrigin: boolean,
      ): Promise<boolean> {
        return await navigateWebviewDestination({
          currentTrustedOrigin,
          dependencies: {
            authorizeOriginChange(requestedUrl, previousTrustedOrigin) {
              return OriginValidator.authorizeOriginChange({
                confirmOriginChange() {
                  return approveCrossOrigin;
                },
                currentTrustedOrigin: Maybe.just(previousTrustedOrigin),
                destinationUrl: requestedUrl,
              });
            },
            commitTrustedOrigin(origin) {
              currentTrustedOrigin = origin;
              navigationOrigins = {
                pendingOrigin: Maybe.nothing<string>(),
                trustedOrigin: Maybe.just(origin),
              };
            },
            getCurrentUrl() {
              return webviewContents.getURL();
            },
            async loadUrl(requestedUrl) {
              programmaticLoadAttempts.push(requestedUrl);
              await webviewContents.loadURL(requestedUrl);
            },
            setPendingOrigin(origin) {
              navigationOrigins = {...navigationOrigins, pendingOrigin: origin};
            },
          },
          destinationUrl,
        });
      };

      const sameOriginNavigation = await navigateGuestToUrl(
        `${trustedOrigin}/same-origin?view=account#messages`,
        false,
      );

      assert.strictEqual(sameOriginNavigation, true);
      assert.strictEqual(OriginValidator.getHttpOrigin(webviewContents.getURL()).unwrapOr('invalid'), trustedOrigin);
      assert.strictEqual(await getDocumentOrigin(webviewContents), trustedOrigin);

      await webviewContents.loadURL(`${trustedOrigin}/meta-refresh`);
      const blockedMetaRefresh = await waitFor(() => {
        return findBlockedNavigationDecision({
          decisions,
          destinationOrigin: attackerOrigin,
          kind: 'navigation',
        });
      });

      assert.strictEqual(blockedMetaRefresh.allowed, false);
      assert.strictEqual(attackerRequests.length, 0);
      assert.strictEqual(OriginValidator.getHttpOrigin(webviewContents.getURL()).unwrapOr('invalid'), trustedOrigin);
      assert.strictEqual(await getDocumentOrigin(webviewContents), trustedOrigin);

      try {
        await webviewContents.loadURL(`${trustedOrigin}/redirect`);
      } catch {
        // Electron can reject the loadURL promise after will-redirect cancels the redirect.
      }
      const blockedRedirect = await waitFor(() => {
        return findBlockedNavigationDecision({
          decisions,
          destinationOrigin: attackerOrigin,
          kind: 'redirect',
        });
      });

      assert.strictEqual(blockedRedirect.allowed, false);
      assert.strictEqual(attackerRequests.length, 0);
      assert.strictEqual(OriginValidator.getHttpOrigin(webviewContents.getURL()).unwrapOr('invalid'), trustedOrigin);
      assert.strictEqual(await getDocumentOrigin(webviewContents), trustedOrigin);
      assert.strictEqual(preloadOrigins.includes(attackerOrigin), false);

      const programmaticLoadAttemptCountBeforeUnapprovedDestination = programmaticLoadAttempts.length;
      const unauthorizedProgrammaticNavigation = await navigateGuestToUrl(`${attackerOrigin}/programmatic`, false);

      assert.strictEqual(unauthorizedProgrammaticNavigation, false);
      assert.strictEqual(programmaticLoadAttempts.length, programmaticLoadAttemptCountBeforeUnapprovedDestination);
      assert.strictEqual(attackerRequests.length, 0);
      assert.strictEqual(OriginValidator.getHttpOrigin(webviewContents.getURL()).unwrapOr('invalid'), trustedOrigin);
      assert.strictEqual(await getDocumentOrigin(webviewContents), trustedOrigin);

      const authorizedEnvironmentChange = await navigateGuestToUrl(`${attackerOrigin}/approved-environment`, true);

      assert.strictEqual(authorizedEnvironmentChange, true);
      assert.strictEqual(OriginValidator.getHttpOrigin(webviewContents.getURL()).unwrapOr('invalid'), attackerOrigin);
      assert.strictEqual(await getDocumentOrigin(webviewContents), attackerOrigin);
      assert.strictEqual(attackerRequests.includes('/approved-environment'), true);
      await waitFor(() => {
        for (const origin of preloadOrigins) {
          if (origin === attackerOrigin) {
            return Maybe.just(origin);
          }
        }

        return Maybe.nothing<string>();
      });
    } finally {
      if (browserWindow !== null && !browserWindow.isDestroyed()) {
        browserWindow.destroy();
      }
      for (const webviewContents of createdGuestContents) {
        if (!webviewContents.isDestroyed()) {
          webviewContents.close();
        }
      }
      ipcMain.removeListener('test:privileged-preload', onPrivilegedPreload);
      app.removeListener('web-contents-created', onWebContentsCreated);
      await closeTestHttpServer(trustedServer.server);
      await closeTestHttpServer(attackerServer.server);
    }
  });
});
