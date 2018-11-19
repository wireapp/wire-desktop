/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {webContents} from 'electron';

// webContents.getFocusedWebContents() is broken, always returns the last one
// pretty much anything near focus/blur behavior with webviews are broken in Electron 3

class WebViewFocus {
  private static current: number = 0;
  public static readonly bindTracker = (webviewEvent: Electron.Event, contents: Electron.WebContents): void => {
    if ((contents as any).getType() === 'webview') {
      // Undocumented event @ https://github.com/electron/electron/pull/14344/files
      (<any>contents).on('focus-change', (event: {}, isFocus: boolean, guestInstanceId: number) => {
        if (isFocus) {
          WebViewFocus.current = guestInstanceId;
        }
      });
    }
  };

  public static readonly getFocusedWebContents = (): Electron.WebContents | undefined => {
    let webContentFound: Electron.WebContents | undefined;
    for (const webContent of webContents.getAllWebContents()) {
      if (
        typeof (<any>webContent).viewInstanceId == 'number' &&
        (<any>webContent).viewInstanceId === WebViewFocus.current
      ) {
        webContentFound = webContent;
        break;
      }
    }
    return webContentFound;
  };
}

export {WebViewFocus};
