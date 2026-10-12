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

import {BrowserWindow, WebContents} from 'electron';
import {Maybe} from 'true-myth';

import * as assert from 'assert';
import * as http from 'http';

import * as OriginValidator from './OriginValidator';
import type {NavigationEvent} from './OriginValidator';
import type {NavigationDecision} from './WebviewNavigation';
import {registerNavigationEventHandlers} from './WebviewNavigation';

type TestHttpServer = {
  origin: string;
  server: http.Server;
};

type RegisterElectronNavigationHandlersParameters = {
  logNavigationDecision(decision: NavigationDecision): void;
  trustedOrigin: string;
  webContents: WebContents;
};

type AttachedWebviewReference = {
  contents: WebContents | null;
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

function registerElectronNavigationHandlers(parameters: RegisterElectronNavigationHandlersParameters): void {
  function onWillNavigate(listener: (event: NavigationEvent, destinationUrl: string) => void): void {
    parameters.webContents.on('will-navigate', listener);
  }

  function onWillRedirect(
    listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
  ): void {
    parameters.webContents.on('will-redirect', listener);
  }

  function onDidStartNavigation(
    listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
  ): void {
    parameters.webContents.on('did-start-navigation', listener);
  }

  function stopNavigation(): void {
    parameters.webContents.stop();
  }

  registerNavigationEventHandlers({
    getNavigationOrigins: () => {
      return {
        pendingOrigin: Maybe.nothing<string>(),
        trustedOrigin: Maybe.just(parameters.trustedOrigin),
      };
    },
    logNavigationDecision: parameters.logNavigationDecision,
    onDidStartNavigation,
    onWillNavigate,
    onWillRedirect,
    stopNavigation,
  });
}

describe('WebviewNavigation Electron integration', function () {
  this.timeout(15000);

  it('prevents a real webview meta refresh from reaching an untrusted origin', async () => {
    let attackerRequestCount = 0;
    const attackerServer = await startTestHttpServer((_request, response) => {
      attackerRequestCount += 1;
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end('<title>attacker</title>');
    });

    let trustedOrigin = '';
    const trustedServer = await startTestHttpServer((request, response) => {
      if (request.url === '/wrapper') {
        const initialWebviewUrl = `${trustedOrigin}/meta-refresh?id=00000000-0000-4000-8000-000000000001`;
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(
          `<html><body><webview src="${initialWebviewUrl}" style="width:600px;height:400px"></webview></body></html>`,
        );
        return;
      }

      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end(
        `<meta http-equiv="refresh" content="0;url=${attackerServer.origin}/stage2/"><title>trusted</title>`,
      );
    });
    trustedOrigin = trustedServer.origin;

    const browserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
      },
    });
    const decisions: NavigationDecision[] = [];
    const attachedWebviewReference: AttachedWebviewReference = {contents: null};
    let resolveBlockedNavigation: (decision: NavigationDecision) => void = () => {};
    const blockedNavigation = new Promise<NavigationDecision>(resolve => {
      resolveBlockedNavigation = resolve;
    });

    browserWindow.webContents.on('did-attach-webview', (_event, webviewContents) => {
      attachedWebviewReference.contents = webviewContents;
      registerElectronNavigationHandlers({
        logNavigationDecision: decision => {
          decisions.push(decision);
          if (!decision.allowed && decision.kind === 'navigation') {
            resolveBlockedNavigation(decision);
          }
        },
        trustedOrigin,
        webContents: webviewContents,
      });
    });

    try {
      await browserWindow.loadURL(`${trustedServer.origin}/wrapper`);
      const blockedDecision = await blockedNavigation;
      await new Promise<void>(resolve => {
        setTimeout(resolve, 50);
      });

      assert.strictEqual(blockedDecision.allowed, false);
      assert.strictEqual(attackerRequestCount, 0);
      assert.strictEqual(
        decisions.some(decision => decision.destinationOrigin === attackerServer.origin),
        true,
      );
      const attachedContents = attachedWebviewReference.contents;
      if (attachedContents === null) {
        throw new Error('The privileged test WebView was not attached');
      }

      const actualWebviewOrigin = OriginValidator.getHttpOrigin(attachedContents.getURL());
      assert.strictEqual(actualWebviewOrigin.unwrapOr('invalid'), trustedServer.origin);
    } finally {
      browserWindow.destroy();
      await closeTestHttpServer(trustedServer.server);
      await closeTestHttpServer(attackerServer.server);
    }
  });
});
