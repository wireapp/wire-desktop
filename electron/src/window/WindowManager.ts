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

import {app, BrowserWindow} from 'electron';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export class WindowManager {
  private static primaryWindowId: number | undefined;

  static getPrimaryWindow(): BrowserWindow | void {
    logger.info(`WindowManager: primaryWindowId: ${WindowManager.primaryWindowId}`);
    logger.info(
      `WindowManager: all windows: ${BrowserWindow.getAllWindows()
        .map(window => `#${window.id}`)
        .join(', ')}`,
    );
    logger.info(
      `WindowManager: focused window: ${
        BrowserWindow.getFocusedWindow() ? BrowserWindow.getFocusedWindow()!.id : 'null'
      }`,
    );
    const [primaryWindow] = WindowManager.primaryWindowId
      ? [BrowserWindow.fromId(WindowManager.primaryWindowId)]
      : BrowserWindow.getAllWindows();
    if (primaryWindow) {
      logger.info(`Got primaryWindow with ID "${primaryWindow.id}"`);
      return primaryWindow;
    }
  }

  static setPrimaryWindowId(newPrimaryWindowId: number): void {
    logger.info(`Setting primary window ID to "${newPrimaryWindowId}" ...`);
    WindowManager.primaryWindowId = newPrimaryWindowId;
  }

  static showPrimaryWindow(): void {
    const browserWindow = WindowManager.getPrimaryWindow();

    if (browserWindow) {
      if (browserWindow.isMinimized()) {
        browserWindow.restore();
      } else if (!browserWindow.isVisible()) {
        browserWindow.show();
      }

      browserWindow.focus();
    }
  }

  static sendActionToPrimaryWindow(action: string, ...args: any[]): void {
    const primaryWindow = WindowManager.getPrimaryWindow();

    if (primaryWindow) {
      logger.info(`Sending action "${action}" to window with ID "${primaryWindow.id}":`, {args});
      primaryWindow.webContents.send(action, ...args);
    } else {
      logger.warn(`Got no primary window, can't send action "${action}".`);
    }
  }

  static async sendActionAndFocusWindow(action: string, ...args: any[]): Promise<void> {
    await app.whenReady();

    const primaryWindow = WindowManager.getPrimaryWindow();

    if (primaryWindow) {
      if (primaryWindow.webContents.isLoading()) {
        primaryWindow.webContents.once('did-finish-load', () => primaryWindow.webContents.send(action, ...args));
      } else {
        if (!primaryWindow.isVisible()) {
          primaryWindow.show();
          primaryWindow.focus();
        }
        primaryWindow.webContents.send(action, ...args);
      }
    } else {
      logger.warn(`Got no primary window, can't focus window and send action "${action}".`);
    }
  }
}
