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

import type {MenuItem} from 'electron';

import type {App} from '../../actions/createApp';

export const menuBar = (app: App) => {
  // eslint-disable-next-line valid-jsdoc
  /**
   * Triggers an Electron application menu item by matching its label.
   * @param {string} label - The menu label to match against (e.g., 'Settings')
   * @returns A Promise resolving to the serialized accelerator string of the clicked MenuItem
   */
  const triggerApplicationMenu = async (label: string): Promise<Pick<MenuItem, 'accelerator'>> => {
    return await app.evaluate(async ({Menu, BrowserWindow}, label) => {
      const menu = Menu.getApplicationMenu();

      const target = menu?.items.flatMap(item => item.submenu?.items ?? []).find(item => label === item.label);

      if (!target) {
        throw new Error('Menu item not found');
      }

      const targetWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      if (!targetWindow) {
        throw new Error('No Electron window found to send the menu event to');
      }

      // Programmatically trigger the menu item's click action
      target.click(target, targetWindow);
      return {
        accelerator: target.accelerator,
      };
    }, label);
  };

  return {triggerApplicationMenu};
};
