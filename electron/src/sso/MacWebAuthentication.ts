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

import type {BrowserWindow} from 'electron';
// Keep the optional macOS addon out of Linux/Windows TypeScript resolution.
type NobjcObject = {[selector: string]: (...args: any[]) => any};

let presentationProviderClass: NobjcObject | undefined;
const presentationAnchors = new Map<string, NobjcObject>();

export interface WebAuthenticationRequest {
  result: Promise<string>;
  cancel: () => void;
}

// Lazy-load the macOS-only addon. Only public AuthenticationServices APIs are used.
// Electron already runs the main Cocoa event loop; do not start a second run loop.
export function startMacWebAuthentication(
  parent: BrowserWindow,
  url: string,
  scheme: string,
): WebAuthenticationRequest {
  const {NobjcLibrary, NobjcClass, getPointer, fromPointer, typedBlock} = require('objc-js');
  const foundation = new NobjcLibrary('/System/Library/Frameworks/Foundation.framework/Foundation');
  const authentication = new NobjcLibrary(
    '/System/Library/Frameworks/AuthenticationServices.framework/AuthenticationServices',
  );
  const nsWindow = fromPointer(parent.getNativeWindowHandle()).window();
  // presentationContextProvider is weak on the Apple side. Retain the provider,
  // session and block in this closure until completion/cancellation.
  // objc-js protocol delegates always dispatch through a TSFN in Electron,
  // even on the JS thread. Apple's synchronous anchor request inside start()
  // then waits on that same blocked thread. A public NSObject subclass uses
  // the bridge's synchronous main-thread dispatch path instead.
  presentationProviderClass ??= NobjcClass.define({
    name: 'WireWebAuthenticationPresentationProvider',
    superclass: 'NSObject',
    protocols: ['ASWebAuthenticationPresentationContextProviding'],
    methods: {
      'presentationAnchorForWebAuthenticationSession:': {
        types: '@@:@',
        implementation: (self: NobjcObject) => presentationAnchors.get(getPointer(self).toString('hex')) ?? null,
      },
    },
  });
  const provider = presentationProviderClass!.alloc().init();
  const providerKey = getPointer(provider).toString('hex');
  presentationAnchors.set(providerKey, nsWindow);
  let nativeSession: NobjcObject | undefined;
  let finished = false;
  let rejectResult: (error: Error) => void = () => {};
  const result = new Promise<string>((resolve, reject) => {
    rejectResult = reject;
    const handler = typedBlock(
      {returns: 'v', args: ['@', '@']},
      (callback: NobjcObject | null, error: NobjcObject | null) => {
        if (finished) {
          return;
        }
        finished = true;
        if (error || !callback) {
          // Never propagate NSError text: it can contain the authentication URL.
          reject(new Error('Browser authentication cancelled or failed.'));
        } else {
          try {
            resolve(callback.absoluteString().toString());
          } catch {
            reject(new Error('Invalid browser authentication callback.'));
          }
        }
      },
    );
    nativeSession = authentication.ASWebAuthenticationSession.alloc().initWithURL$callbackURLScheme$completionHandler$(
      foundation.NSURL.URLWithString$(foundation.NSString.stringWithUTF8String$(url)),
      foundation.NSString.stringWithUTF8String$(scheme),
      handler,
    );
    nativeSession!.setPresentationContextProvider$(provider);
    nativeSession!.setPrefersEphemeralWebBrowserSession$(true);
    if (!nativeSession!.start()) {
      finished = true;
      reject(new Error('Unable to start browser authentication.'));
    }
  });
  return {
    result,
    cancel: () => {
      // Reference provider explicitly so it remains alive for the entire request.
      nativeSession?.setPresentationContextProvider$(provider);
      if (!finished) {
        finished = true;
        nativeSession?.cancel();
        rejectResult(new Error('Browser authentication cancelled.'));
      }
      nativeSession = undefined;
      presentationAnchors.delete(providerKey);
    },
  };
}
