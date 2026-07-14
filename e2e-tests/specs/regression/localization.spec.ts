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

import fs from 'node:fs/promises';
import nodeOs from 'node:os';
import path from 'node:path';

import {createApp, type App} from '../../actions/createApp';
import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {ssoPage} from '../../poms/webapp/sso.page';

type MenuItemSnapshot = {
  label: string;
  checked?: boolean;
  enabled?: boolean;
  type?: string;
  submenu?: MenuItemSnapshot[];
};

type RestartDialogSnapshot = {
  buttons: string[];
  message: string;
  title?: string;
  type?: string;
};

type ElectronPlatform = 'darwin' | 'win32';

const normalizeMenuLabel = (label?: string): string => (label ?? '').replace(/&/g, '');

const getElectronPlatform = async (app: App): Promise<ElectronPlatform> =>
  app.evaluate(() => process.platform as ElectronPlatform);

const getApplicationMenu = async (app: App): Promise<MenuItemSnapshot[]> =>
  app.evaluate(({Menu}) => {
    const serialize = (item: MenuItem): MenuItemSnapshot => ({
      label: item.label,
      checked: item.checked,
      enabled: item.enabled,
      type: item.type,
      submenu: item.submenu?.items.map(serialize),
    });

    return Menu.getApplicationMenu()?.items.map(serialize) ?? [];
  });

const findMenuItem = (
  items: MenuItemSnapshot[],
  predicate: (item: MenuItemSnapshot) => boolean,
): MenuItemSnapshot | undefined => {
  for (const item of items) {
    if (predicate(item)) {
      return item;
    }

    if (item.submenu) {
      const nestedItem = findMenuItem(item.submenu, predicate);

      if (nestedItem) {
        return nestedItem;
      }
    }
  }

  return undefined;
};

const expectSelectedMenuLanguage = async (app: App, expectedLanguageLabel: 'English' | 'Deutsch') => {
  const menu = await getApplicationMenu(app);
  const languageItem = findMenuItem(menu, item => normalizeMenuLabel(item.label) === expectedLanguageLabel);

  expect(languageItem, `Expected language "${expectedLanguageLabel}" to exist in the menu`).toBeTruthy();
  expect(languageItem?.checked, `Expected language "${expectedLanguageLabel}" to be selected`).toBe(true);
};

/*
 * Selects a language from Electron's native application menu.
 */
const triggerLanguageMenuItem = async (app: App, expectedLanguageLabel: 'English' | 'Deutsch'): Promise<void> => {
  await app.evaluate(({BrowserWindow, Menu}, languageLabel) => {
    const normalizeLabel = (label?: string): string => (label ?? '').replace(/&/g, '');

    const isLanguageSubmenu = (items: MenuItem[]): boolean => {
      const radioLabels = new Set(items.filter(item => item.type === 'radio').map(item => normalizeLabel(item.label)));

      return radioLabels.has('English') && radioLabels.has('Deutsch');
    };

    const findLanguageItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        const submenuItems = item.submenu?.items ?? [];

        if (isLanguageSubmenu(submenuItems)) {
          return submenuItems.find(
            submenuItem => submenuItem.type === 'radio' && normalizeLabel(submenuItem.label) === languageLabel,
          );
        }

        const nestedItem = findLanguageItem(submenuItems);

        if (nestedItem) {
          return nestedItem;
        }
      }

      return undefined;
    };

    const formatMenu = (items: MenuItem[], depth = 0): string[] =>
      items.flatMap(item => {
        const prefix = `${'  '.repeat(depth)}- ${normalizeLabel(item.label) || `[${item.type}]`}`;
        return [prefix, ...formatMenu(item.submenu?.items ?? [], depth + 1)];
      });

    const applicationMenu = Menu.getApplicationMenu();
    const menuItems = applicationMenu?.items ?? [];
    const target = findLanguageItem(menuItems);

    if (!target) {
      throw new Error(
        `Language menu item was not found: ${languageLabel}\n` +
          `Actual application menu:\n${formatMenu(menuItems).join('\n')}`,
      );
    }

    if (!target.enabled) {
      throw new Error(`Language menu item is disabled: ${languageLabel}`);
    }

    const targetWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

    if (!targetWindow) {
      throw new Error('No Electron window found for the menu event');
    }

    target.click(target, targetWindow);
  }, expectedLanguageLabel);
};

/*
 * Replaces Electron's native message box with a controllable promise.
 */
const installRestartDialogProbe = async (app: App): Promise<void> => {
  await app.evaluate(({app: electronApp, dialog}) => {
    type DialogResult = {
      checkboxChecked: boolean;
      response: number;
    };

    type DialogOptions = {
      buttons?: string[];
      message: string;
      title?: string;
      type?: string;
    };

    type Probe = {
      options: {
        buttons: string[];
        message: string;
        title?: string;
        type?: string;
      };
      resolve: (result: DialogResult) => void;
    };

    const globals = globalThis as typeof globalThis & {
      __wireRestartDialogProbe?: Probe;
    };

    if (process.platform === 'win32') {
      const mutableElectronApp = electronApp as unknown as {
        relaunch: () => void;
      };

      mutableElectronApp.relaunch = () => {};
    }

    const mutableDialog = dialog as unknown as {
      showMessageBox: (...args: unknown[]) => Promise<DialogResult>;
    };

    mutableDialog.showMessageBox = (...args: unknown[]) => {
      const options = (args.length === 1 ? args[0] : args[1]) as DialogOptions;

      return new Promise<DialogResult>(resolve => {
        globals.__wireRestartDialogProbe = {
          options: {
            buttons: [...(options.buttons ?? [])],
            message: options.message,
            title: options.title,
            type: options.type,
          },
          resolve,
        };
      });
    };
  });
};

const getRestartDialog = async (app: App): Promise<RestartDialogSnapshot> => {
  await expect
    .poll(() =>
      app.evaluate(() => {
        type Probe = {
          options: RestartDialogSnapshot;
        };

        const globals = globalThis as typeof globalThis & {
          __wireRestartDialogProbe?: Probe;
        };

        return globals.__wireRestartDialogProbe?.options ?? null;
      }),
    )
    .not.toBeNull();

  return app.evaluate(() => {
    type Probe = {
      options: RestartDialogSnapshot;
    };

    const globals = globalThis as typeof globalThis & {
      __wireRestartDialogProbe?: Probe;
    };

    const probe = globals.__wireRestartDialogProbe;

    if (!probe) {
      throw new Error('The restart dialog was not opened');
    }

    return probe.options;
  });
};

/*
 * Resolves the native dialog with response 1, corresponding to:
 *
 * macOS: 'Beenden'
 * Windows: 'Jetzt Neu Starten'
 */
const confirmRestartDialog = async (app: App): Promise<void> => {
  const closePromise = app.waitForEvent('close');

  const resolvePromise = app.evaluate(() => {
    type DialogResult = {
      checkboxChecked: boolean;
      response: number;
    };

    type Probe = {
      resolve: (result: DialogResult) => void;
    };

    const globals = globalThis as typeof globalThis & {
      __wireRestartDialogProbe?: Probe;
    };

    const probe = globals.__wireRestartDialogProbe;

    if (!probe) {
      throw new Error('The restart dialog was not opened');
    }

    probe.resolve({
      response: 1,
      checkboxChecked: false,
    });
  });

  await closePromise;
  await resolvePromise.catch(() => undefined);
};

const isAppRunning = (app: App): boolean => {
  const process = app.process();

  return process.exitCode === null && process.signalCode === null;
};

const closeAppIfRunning = async (app?: App): Promise<void> => {
  if (app && isAppRunning(app)) {
    await app.close();
  }
};

test.describe('Localization', () => {
  test('I want to verify initial language is EN', {tag: ['@TC-11283', '@regression']}, async ({app, createUser}) => {
    const user = await createUser();

    await test.step('Go to login screen and verify welcome screen', async () => {
      await expect(ssoPage(app.page).codeEmailInput).toBeVisible();
    });

    await test.step('User logs in', async () => {
      await loginUser(app.page, user);
    });

    await test.step('Verify English is selected in the menu bar', async () => {
      await expectSelectedMenuLanguage(app, 'English');
    });

    await test.step('Verify English "All conversations"', async () => {
      await expect(app.page.getByText('All conversations')).toBeVisible();
    });
  });

  test('I want to switch language to DE', {tag: ['@TC-11284', '@regression']}, async ({appOptions, createUser}) => {
    const dataDir = await fs.mkdtemp(path.join(nodeOs.tmpdir(), 'wire-localization-de-'));
    const user = await createUser();
    let currentApp: App | undefined;

    try {
      const initialApp = await createApp({
        ...appOptions,
        dataDir,
      });
      currentApp = initialApp;
      const electronPlatform = await getElectronPlatform(initialApp);

      await test.step('Go to login screen and verify welcome screen', async () => {
        await expect(ssoPage(initialApp.page).codeEmailInput).toBeVisible();
      });

      await test.step('User logs in', async () => {
        await loginUser(initialApp.page, user);
        await expectSelectedMenuLanguage(initialApp, 'English');
        await expect(initialApp.page.getByText('All conversations')).toBeVisible();
      });

      await test.step('Switch language to German via menu bar', async () => {
        await installRestartDialogProbe(initialApp);
        await triggerLanguageMenuItem(initialApp, 'Deutsch');
      });

      await test.step('Verify restart popup is shown', async () => {
        const restartDialog = await getRestartDialog(initialApp);

        expect(restartDialog).toMatchObject({
          type: 'info',
          title: 'Neustart erforderlich',
          message: 'Bitte starten Sie Wire erneut, damit diese Einstellung wirksam wird.',
        });

        expect(restartDialog.buttons).toHaveLength(2);
        expect(restartDialog.buttons[0]).toBe('Später');

        if (electronPlatform === 'darwin') {
          expect(restartDialog.buttons[1]).toMatch(/beenden$/);
        } else if (electronPlatform === 'win32') {
          expect(restartDialog.buttons[1]).toBe('Jetzt Neu Starten');
        } else {
          throw new Error(`TC-11284 is not supported on Electron platform: ${electronPlatform}`);
        }
      });

      await test.step('User restarts app via popup', async () => {
        await confirmRestartDialog(initialApp);
        currentApp = undefined;
      });

      const restartedApp = await createApp({
        ...appOptions,
        dataDir,
      });
      currentApp = restartedApp;

      await test.step('Verify German is selected in the menu bar', async () => {
        await expectSelectedMenuLanguage(restartedApp, 'Deutsch');
      });

      await test.step('Verify German "Alle Unterhaltungen"', async () => {
        await expect(
          restartedApp.page.getByText('Alle Unterhaltungen', {
            exact: true,
          }),
        ).toBeVisible();
      });
    } finally {
      await closeAppIfRunning(currentApp).catch(() => undefined);
      await fs.rm(dataDir, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  });
});
