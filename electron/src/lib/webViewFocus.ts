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

import {Event, WebContents, webContents} from 'electron';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

/*
 * Note: webContents.getFocusedWebContents() is broken, always returns the last one
 *
 * Note: Pretty much anything near focus/blur behavior with webviews are broken
 * in Electron 3 so we had to do our own webview focus tracking for now using the
 * (undocumented) focus-change event added in Electron 3
 */

export class WebViewFocus {
  private static current = 0;

  public static readonly bindTracker = (event: Event, contents: WebContents): void => {
    if (contents.getType() === 'webview') {
      // Undocumented event @ https://github.com/electron/electron/pull/14344/files
      (contents as any).on('focus-change', (event: Event, isFocus: boolean, guestInstanceId: number) => {
        if (isFocus) {
          logger.info(`Setting WebViewFocus ID to "${guestInstanceId}" ...`);
          WebViewFocus.current = guestInstanceId;
        }
      });
    }
  };

  public static readonly getFocusedWebContents = (): WebContents | void => {
    for (const webContent of webContents.getAllWebContents()) {
      if (
        typeof (webContent as any).viewInstanceId == 'number' &&
        (webContent as any).viewInstanceId === WebViewFocus.current
      ) {
        return webContent;
      }
    }
  };
}
