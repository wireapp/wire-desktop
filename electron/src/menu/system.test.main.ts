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

import type {WallClock} from '@enormora/wall-clock/wall-clock';
import {globalShortcut, Menu, MenuItemConstructorOptions} from 'electron';
import {fake, replace, restore} from 'sinon';

import * as assert from 'assert';

import {createMenu, registerGlobalShortcuts, unregisterGlobalShortcuts} from './system';

import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import {config} from '../settings/config';

const supportedPlatforms = [
  {name: 'Windows', platform: {IS_WINDOWS: true, IS_MAC_OS: false}},
  {name: 'macOS', platform: {IS_WINDOWS: false, IS_MAC_OS: true}},
];

function collectMenuAccelerators(menuItems: MenuItemConstructorOptions[]): string[] {
  return menuItems.flatMap(menuItem => {
    const menuItemAccelerators = typeof menuItem.accelerator === 'string' ? [menuItem.accelerator] : [];
    const submenuAccelerators = Array.isArray(menuItem.submenu)
      ? collectMenuAccelerators(menuItem.submenu as MenuItemConstructorOptions[])
      : [];

    return [...menuItemAccelerators, ...submenuAccelerators];
  });
}

describe('system menu shortcuts', () => {
  afterEach(() => restore());

  for (const supportedPlatform of supportedPlatforms) {
    it(`registers and unregisters the shared shortcuts on ${supportedPlatform.name}`, () => {
      replace(EnvironmentUtil, 'platform', supportedPlatform.platform);
      const registerShortcut = fake();
      const unregisterAllShortcuts = fake();
      replace(globalShortcut, 'register', registerShortcut as any);
      replace(globalShortcut, 'unregisterAll', unregisterAllShortcuts as any);

      registerGlobalShortcuts();
      unregisterGlobalShortcuts();

      const actualAccelerators = registerShortcut.getCalls().map(call => call.args[0]);
      const expectedAccelerators = [
        'CmdOrCtrl+Alt+M',
        ...Array.from({length: config.maximumAccounts}, (_unused, index) => `CmdOrCtrl+${index + 1}`),
      ];
      assert.deepStrictEqual(actualAccelerators, expectedAccelerators);
      assert.strictEqual(unregisterAllShortcuts.callCount, 1);
    });
  }

  it('keeps the native menu accelerators for the current supported platform', function () {
    if (!EnvironmentUtil.platform.IS_MAC_OS && !EnvironmentUtil.platform.IS_WINDOWS) {
      this.skip();
    }

    const buildMenu = fake();
    replace(Menu, 'buildFromTemplate', buildMenu as any);

    createMenu(false, {currentDate: new Date()} as WallClock);

    const actualAccelerators = collectMenuAccelerators(buildMenu.firstCall.args[0] as MenuItemConstructorOptions[]);
    if (EnvironmentUtil.platform.IS_MAC_OS) {
      assert.ok(actualAccelerators.includes('Command+Q'));
      assert.ok(actualAccelerators.includes('Command+,'));
    } else {
      assert.ok(actualAccelerators.includes('Alt+F4'));
      assert.ok(actualAccelerators.includes('Ctrl+,'));
    }
    assert.strictEqual(actualAccelerators.includes('Ctrl+Q'), false);
    assert.strictEqual(actualAccelerators.includes('Ctrl+Alt+M'), false);
  });
});
