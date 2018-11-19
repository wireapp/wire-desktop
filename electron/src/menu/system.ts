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

import autoLaunch = require('auto-launch');
import {Menu, dialog, globalShortcut, ipcMain, shell} from 'electron';

import * as config from '../js/config';
import * as environment from '../js/environment';
import * as lifecycle from '../js/lifecycle';
import * as windowManager from '../js/window-manager';
import {EVENT_TYPE} from '../lib/eventType';
import {WebViewFocus} from '../lib/webViewFocus';
import * as locale from '../locale/locale';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

import {ElectronMenuItemWithI18n, Supportedi18nLanguage} from '../interfaces/';

const launchCmd = process.env.APPIMAGE || process.execPath;

let menu: Menu;

const launcher = new autoLaunch({
  isHidden: true,
  name: config.NAME,
  path: launchCmd,
});

const getPrimaryWindow = (): Electron.BrowserWindow => windowManager.getPrimaryWindow();

// TODO: disable menus when not in focus
const sendAction = (action: string): void => {
  const primaryWindow = getPrimaryWindow();
  if (primaryWindow) {
    primaryWindow.webContents.send(EVENT_TYPE.UI.SYSTEM_MENU, action);
  }
};

const separatorTemplate: ElectronMenuItemWithI18n = {
  type: 'separator',
};

const createLanguageTemplate = (languageCode: Supportedi18nLanguage): ElectronMenuItemWithI18n => {
  return {
    click: () => changeLocale(languageCode),
    label: locale.SUPPORTED_LANGUAGES[languageCode],
    type: 'radio',
  };
};

const createLanguageSubmenu = (): ElectronMenuItemWithI18n[] => {
  return Object.keys(locale.SUPPORTED_LANGUAGES).map(supportedLanguage =>
    createLanguageTemplate(supportedLanguage as Supportedi18nLanguage)
  );
};

const localeTemplate: ElectronMenuItemWithI18n = {
  i18n: 'menuLocale',
  submenu: createLanguageSubmenu(),
};

const aboutTemplate: ElectronMenuItemWithI18n = {
  click: () => ipcMain.emit(EVENT_TYPE.ABOUT.SHOW),
  i18n: 'menuAbout',
};

const signOutTemplate: ElectronMenuItemWithI18n = {
  click: () => sendAction(EVENT_TYPE.ACTION.SIGN_OUT),
  i18n: 'menuSignOut',
};

const conversationTemplate: ElectronMenuItemWithI18n = {
  i18n: 'menuConversation',
  submenu: [
    {
      accelerator: 'CmdOrCtrl+N',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.START),
      i18n: 'menuStart',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+K',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.PING),
      i18n: 'menuPing',
    },
    {
      click: () => sendAction(EVENT_TYPE.CONVERSATION.CALL),
      i18n: 'menuCall',
    },
    {
      click: () => sendAction(EVENT_TYPE.CONVERSATION.VIDEO_CALL),
      i18n: 'menuVideoCall',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+I',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.PEOPLE),
      i18n: 'menuPeople',
    },
    {
      accelerator: 'Shift+CmdOrCtrl+K',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.ADD_PEOPLE),
      i18n: 'menuAddPeople',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+D',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.ARCHIVE),
      i18n: 'menuArchive',
    },
    {
      click: () => sendAction(EVENT_TYPE.CONVERSATION.DELETE),
      i18n: 'menuDelete',
    },
  ],
};

const showWireTemplate: ElectronMenuItemWithI18n = {
  accelerator: 'CmdOrCtrl+0',
  click: () => getPrimaryWindow().show(),
  label: config.NAME,
};

const toggleMenuTemplate: ElectronMenuItemWithI18n = {
  checked: settings.restore(SettingsType.SHOW_MENU_BAR, true),
  click: () => {
    const mainBrowserWindow = getPrimaryWindow();
    const showMenu = mainBrowserWindow.isMenuBarAutoHide();

    mainBrowserWindow.setAutoHideMenuBar(!showMenu);

    if (!showMenu) {
      mainBrowserWindow.setMenuBarVisibility(showMenu);
    }

    settings.save(SettingsType.SHOW_MENU_BAR, showMenu);
  },
  i18n: 'menuShowHide',
  type: 'checkbox',
};

const toggleFullScreenTemplate: ElectronMenuItemWithI18n = {
  accelerator: environment.platform.IS_MAC_OS ? 'Alt+Command+F' : 'F11',
  click: () => {
    const mainBrowserWindow = getPrimaryWindow();
    mainBrowserWindow.setFullScreen(!mainBrowserWindow.isFullScreen());
  },
  i18n: 'menuFullScreen',
  type: 'checkbox',
};

const toggleAutoLaunchTemplate: ElectronMenuItemWithI18n = {
  checked: settings.restore(SettingsType.AUTO_LAUNCH, false),
  click: () => {
    const shouldAutoLaunch = !settings.restore(SettingsType.AUTO_LAUNCH);
    settings.save(SettingsType.AUTO_LAUNCH, shouldAutoLaunch);
    return shouldAutoLaunch ? launcher.enable() : launcher.disable();
  },
  i18n: 'menuStartup',
  type: 'checkbox',
};

const supportsSpellCheck = config.SPELLCHECK.SUPPORTED_LANGUAGES.includes(locale.getCurrent());

const menuUndoRedo = [
  {
    i18n: 'menuUndo',
    role: 'undo',
  },
  {
    i18n: 'menuRedo',
    role: 'redo',
  },
  separatorTemplate,
];
const editTemplate: ElectronMenuItemWithI18n = {
  i18n: 'menuEdit',
  submenu: [
    {
      accelerator: 'CmdOrCtrl+Z',
      click: (menuItem: MenuItem, focusedWin: BrowserWindow) => {
        const focusedWebContents = WebViewFocus.getFocusedWebContents();
        if (focusedWebContents) {
          focusedWebContents.undo();
        }
      },
      i18n: 'menuUndo',
    },
    {
      accelerator: 'Shift+CmdOrCtrl+Z',
      click: (menuItem: MenuItem, focusedWin: BrowserWindow) => {
        const focusedWebContents = WebViewFocus.getFocusedWebContents();
        if (focusedWebContents) {
          focusedWebContents.redo();
        }
      },
      i18n: 'menuRedo',
    },
    separatorTemplate,
    {
      i18n: 'menuCut',
      role: 'cut',
    },
    {
      i18n: 'menuCopy',
      role: 'copy',
    },
    {
      i18n: 'menuPaste',
      role: 'paste',
    },
    separatorTemplate,
    {
      i18n: 'menuSelectAll',
      role: 'selectall',
    },
    separatorTemplate,
    {
      checked: supportsSpellCheck && settings.restore(SettingsType.SPELL_CHECK, false),
      click: (menuItem: Electron.MenuItem): boolean => settings.save(SettingsType.SPELL_CHECK, menuItem.checked),
      enabled: supportsSpellCheck,
      i18n: 'menuSpelling',
      type: 'checkbox',
    },
  ],
};

const windowTemplate: ElectronMenuItemWithI18n = {
  i18n: 'menuWindow',
  role: 'window',
  submenu: [
    {
      i18n: 'menuMinimize',
      role: 'minimize',
    },
    {
      i18n: 'menuClose',
      role: 'close',
    },
    separatorTemplate,
    {
      accelerator: environment.platform.IS_MAC_OS ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.SHOW_NEXT),
      i18n: 'menuNextConversation',
    },
    {
      accelerator: environment.platform.IS_MAC_OS ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: () => sendAction(EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS),
      i18n: 'menuPreviousConversation',
    },
  ],
};

const helpTemplate: ElectronMenuItemWithI18n = {
  i18n: 'menuHelp',
  role: 'help',
  submenu: [
    {
      click: () => shell.openExternal(environment.web.getWebsiteUrl(config.URL.LEGAL)),
      i18n: 'menuLegal',
    },
    {
      click: () => shell.openExternal(environment.web.getWebsiteUrl(config.URL.PRIVACY)),
      i18n: 'menuPrivacy',
    },
    {
      click: () => shell.openExternal(environment.web.getWebsiteUrl(config.URL.LICENSES)),
      i18n: 'menuLicense',
    },
    {
      click: () => shell.openExternal(environment.web.getSupportUrl()),
      i18n: 'menuSupport',
    },
    {
      click: () => shell.openExternal(environment.web.getWebsiteUrl()),
      i18n: 'menuWireURL',
    },
  ],
};

const darwinTemplate: ElectronMenuItemWithI18n = {
  label: config.NAME,
  submenu: [
    aboutTemplate,
    separatorTemplate,
    {
      accelerator: 'Command+,',
      click: () => sendAction(EVENT_TYPE.PREFERENCES.SHOW),
      i18n: 'menuPreferences',
    },
    separatorTemplate,
    localeTemplate,
    {
      i18n: 'menuServices',
      role: 'services',
      submenu: [],
    },
    separatorTemplate,
    {
      i18n: 'menuHideWire',
      role: 'hide',
    },
    {
      i18n: 'menuHideOthers',
      role: 'hideothers',
    },
    {
      i18n: 'menuShowAll',
      role: 'unhide',
    },
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Command+Q',
      i18n: 'menuQuit',
      selector: 'terminate:',
    },
  ],
};

const win32Template: ElectronMenuItemWithI18n = {
  label: config.NAME,
  submenu: [
    {
      accelerator: 'Ctrl+,',
      click: () => sendAction(EVENT_TYPE.PREFERENCES.SHOW),
      i18n: 'menuSettings',
    },
    localeTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Alt+F4',
      click: () => lifecycle.quit(),
      i18n: 'menuQuit',
    },
  ],
};

const linuxTemplate: ElectronMenuItemWithI18n = {
  label: config.NAME,
  submenu: [
    {
      click: () => sendAction(EVENT_TYPE.PREFERENCES.SHOW),
      i18n: 'menuPreferences',
    },
    separatorTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    localeTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Ctrl+Q',
      click: () => lifecycle.quit(),
      i18n: 'menuQuit',
    },
  ],
};

const menuTemplate: ElectronMenuItemWithI18n[] = [conversationTemplate, editTemplate, windowTemplate, helpTemplate];

const processMenu = (template: Iterable<ElectronMenuItemWithI18n>, language: Supportedi18nLanguage) => {
  for (const item of template) {
    if (item.submenu) {
      processMenu(item.submenu as Iterable<ElectronMenuItemWithI18n>, language);
    }

    if (locale.SUPPORTED_LANGUAGES[language] === item.label) {
      item.checked = true;
    }

    if (item.i18n) {
      item.label = locale.getText(item.i18n);
    }
  }
};

const changeLocale = (language: Supportedi18nLanguage): void => {
  locale.setLocale(language);
  dialog.showMessageBox(
    {
      buttons: [
        locale.getText('restartLater'),
        environment.platform.IS_MAC_OS ? locale.getText('menuQuit') : locale.getText('restartNow'),
      ],
      message: locale.getText('restartLocale'),
      title: locale.getText('restartNeeded'),
      type: 'info',
    },
    response => {
      if (response === 1) {
        return environment.platform.IS_MAC_OS ? lifecycle.quit() : lifecycle.relaunch();
      }
    }
  );
};

const createMenu = (isFullScreen: boolean): Menu => {
  if (!windowTemplate.submenu) {
    windowTemplate.submenu = [];
  }
  if (!editTemplate.submenu) {
    editTemplate.submenu = [];
  }
  if (!helpTemplate.submenu) {
    helpTemplate.submenu = [];
  }

  if (environment.platform.IS_MAC_OS) {
    menuTemplate.unshift(darwinTemplate);
    if (Array.isArray(windowTemplate.submenu)) {
      windowTemplate.submenu.push(separatorTemplate, showWireTemplate, separatorTemplate, toggleFullScreenTemplate);
    }
    toggleFullScreenTemplate.checked = isFullScreen;
  }

  if (environment.platform.IS_WINDOWS) {
    menuTemplate.unshift(win32Template);
    windowTemplate.i18n = 'menuView';
    if (Array.isArray(windowTemplate.submenu)) {
      windowTemplate.submenu.unshift(toggleMenuTemplate, separatorTemplate);
    }
  }

  if (environment.platform.IS_LINUX) {
    menuTemplate.unshift(linuxTemplate);
    if (Array.isArray(editTemplate.submenu)) {
      editTemplate.submenu.push(separatorTemplate, {
        click: () => sendAction(EVENT_TYPE.PREFERENCES.SHOW),
        i18n: 'menuPreferences',
      });
    }
    if (Array.isArray(windowTemplate.submenu)) {
      windowTemplate.submenu.push(separatorTemplate, toggleMenuTemplate, separatorTemplate, toggleFullScreenTemplate);
    }
    toggleFullScreenTemplate.checked = isFullScreen;
  }

  if (!environment.platform.IS_MAC_OS) {
    if (Array.isArray(helpTemplate.submenu)) {
      helpTemplate.submenu.push(separatorTemplate, aboutTemplate);
    }
  }

  processMenu(menuTemplate, locale.getCurrent());
  menu = Menu.buildFromTemplate(menuTemplate);

  return menu;
};

const registerShortcuts = (): void => {
  // Global mute shortcut
  globalShortcut.register('CmdOrCtrl+Alt+M', () => sendAction(EVENT_TYPE.CONVERSATION.TOGGLE_MUTE));

  // Global account switching shortcut
  const switchAccountShortcut = ['CmdOrCtrl', 'Super'];
  const accountLimit = 3;
  for (const shortcut of switchAccountShortcut) {
    for (let accountId = 0; accountId < accountLimit; accountId++) {
      globalShortcut.register(`${shortcut}+${accountId + 1}`, () =>
        getPrimaryWindow().webContents.send(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, accountId)
      );
    }
  }
};

const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
};

export {createMenu, registerShortcuts, unregisterShortcuts};
