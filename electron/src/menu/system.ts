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
import {dialog, globalShortcut, ipcMain, Menu, MenuItemConstructorOptions, shell} from 'electron';
import * as path from 'path';

import {EVENT_TYPE} from '../lib/eventType';
import * as locale from '../locale/locale';
import {getLogger} from '../logging/getLogger';
import {gatherLogs} from '../logging/loggerUtils';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';
import {WindowManager} from '../window/WindowManager';
import {downloadLogs} from '../lib/download';
import {zipFiles, createFile} from '../lib/zip';

const launchCmd = process.env.APPIMAGE || process.execPath;

const logger = getLogger(path.basename(__filename));

const launcher = new autoLaunch({
  isHidden: true,
  name: config.name,
  path: launchCmd,
});

const separatorTemplate: MenuItemConstructorOptions = {
  type: 'separator',
};

const createLanguageTemplate = (languageCode: locale.SupportedI18nLanguage): MenuItemConstructorOptions => {
  return {
    click: () => changeLocale(languageCode),
    label: locale.SUPPORTED_LANGUAGES[languageCode],
    type: 'radio',
  };
};

const createLanguageSubmenu = (): MenuItemConstructorOptions[] => {
  return Object.keys(locale.SUPPORTED_LANGUAGES).map(supportedLanguage =>
    createLanguageTemplate(supportedLanguage as locale.SupportedI18nLanguage),
  );
};

const localeTemplate: MenuItemConstructorOptions = {
  label: locale.getText('menuLocale'),
  submenu: createLanguageSubmenu(),
};

const aboutTemplate: MenuItemConstructorOptions = {
  click: () => ipcMain.emit(EVENT_TYPE.ABOUT.SHOW),
  label: locale.getText('menuAbout'),
};

const signOutTemplate: MenuItemConstructorOptions = {
  click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.ACTION.SIGN_OUT),
  label: locale.getText('menuSignOut'),
};

const spellingTemplate: MenuItemConstructorOptions = {
  checked: settings.restore(SettingsType.ENABLE_SPELL_CHECKING, true),
  click: () => toggleSpellChecking(),
  label: locale.getText('menuEnableSpellChecking'),
  type: 'checkbox',
};

const conversationTemplate: MenuItemConstructorOptions = {
  label: `&${locale.getText('menuConversation')}`,
  submenu: [
    {
      accelerator: 'CmdOrCtrl+N',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.START),
      label: locale.getText('menuStart'),
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+K',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.PING),
      label: locale.getText('menuPing'),
    },
    {
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.CALL),
      label: locale.getText('menuCall'),
    },
    {
      click: () =>
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.VIDEO_CALL),
      label: locale.getText('menuVideoCall'),
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+I',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.PEOPLE),
      label: locale.getText('menuPeople'),
    },
    {
      accelerator: 'Shift+CmdOrCtrl+K',
      click: () =>
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.ADD_PEOPLE),
      label: locale.getText('menuAddPeople'),
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+D',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.ARCHIVE),
      label: locale.getText('menuArchive'),
    },
    {
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.DELETE),
      label: locale.getText('menuDelete'),
    },
  ],
};

const showWireTemplate: MenuItemConstructorOptions = {
  accelerator: 'CmdOrCtrl+0',
  click: () => {
    const primaryWindow = WindowManager.getPrimaryWindow();
    if (primaryWindow) {
      primaryWindow.show();
    }
  },
  label: `&${config.name}`,
};

const toggleMenuTemplate: MenuItemConstructorOptions = {
  checked: settings.restore(SettingsType.SHOW_MENU_BAR, true),
  click: () => toggleMenuBar(),
  label: locale.getText('menuShowHide'),
  type: 'checkbox',
};

const toggleFullScreenTemplate: MenuItemConstructorOptions = {
  accelerator: EnvironmentUtil.platform.IS_MAC_OS ? 'Alt+Command+F' : 'F11',
  click: () => {
    const mainBrowserWindow = WindowManager.getPrimaryWindow();

    if (mainBrowserWindow) {
      mainBrowserWindow.setFullScreen(!mainBrowserWindow.isFullScreen());
    }
  },
  label: locale.getText('menuFullScreen'),
  type: 'checkbox',
};

const toggleAutoLaunchTemplate: MenuItemConstructorOptions = {
  checked: settings.restore(SettingsType.AUTO_LAUNCH, false),
  click: () => {
    const shouldAutoLaunch = !settings.restore(SettingsType.AUTO_LAUNCH);
    settings.save(SettingsType.AUTO_LAUNCH, shouldAutoLaunch);
    return shouldAutoLaunch ? launcher.enable() : launcher.disable();
  },
  label: locale.getText('menuStartup'),
  type: 'checkbox',
};

const editTemplate: MenuItemConstructorOptions = {
  label: `&${locale.getText('menuEdit')}`,
  submenu: [
    {
      accelerator: 'CmdOrCtrl+Z',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.EDIT.UNDO),
      label: locale.getText('menuUndo'),
    },
    {
      accelerator: 'Shift+CmdOrCtrl+Z',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.EDIT.REDO),
      label: locale.getText('menuRedo'),
    },
    separatorTemplate,
    {
      label: locale.getText('menuCut'),
      role: 'cut',
    },
    {
      label: locale.getText('menuCopy'),
      role: 'copy',
    },
    {
      label: locale.getText('menuPaste'),
      role: 'paste',
    },
    separatorTemplate,
    {
      label: locale.getText('menuSelectAll'),
      role: 'selectAll',
    },
  ],
};

const windowTemplate: MenuItemConstructorOptions = {
  label: `&${locale.getText('menuWindow')}`,
  role: 'window',
  submenu: [
    {
      label: locale.getText('menuMinimize'),
      role: 'minimize',
    },
    {
      label: locale.getText('menuClose'),
      role: 'close',
    },
    separatorTemplate,
    {
      accelerator: EnvironmentUtil.platform.IS_MAC_OS ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click: () =>
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.SHOW_NEXT),
      label: locale.getText('menuNextConversation'),
    },
    {
      accelerator: EnvironmentUtil.platform.IS_MAC_OS ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: () =>
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS),
      label: locale.getText('menuPreviousConversation'),
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+0',
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.WRAPPER.ZOOM_RESET),
      label: locale.getText('menuActualSize'),
    },
    {
      accelerator: 'CmdOrCtrl+Plus',
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.WRAPPER.ZOOM_IN),
      label: locale.getText('menuZoomIn'),
    },
    {
      accelerator: 'CmdOrCtrl+-',
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.WRAPPER.ZOOM_OUT),
      label: locale.getText('menuZoomOut'),
    },
  ],
};

const downloadLogsTemplate: MenuItemConstructorOptions = {
  click: async () => {
    const logFiles = await gatherLogs();
    const archive = await zipFiles(logFiles);
    const archiveFile = await createFile(archive);
    await downloadLogs(archiveFile);
  },
  label: locale.getText('menuDownloadDebugLogs'),
};

const helpTemplate: MenuItemConstructorOptions = {
  label: `&${locale.getText('menuHelp')}`,
  role: 'help',
  submenu: [
    {
      click: () => shell.openExternal(config.legalUrl),
      label: locale.getText('menuLegal'),
    },
    {
      click: () => shell.openExternal(config.privacyUrl),
      label: locale.getText('menuPrivacy'),
    },
    {
      click: () => shell.openExternal(config.licensesUrl),
      label: locale.getText('menuLicense'),
    },
    {
      click: () => shell.openExternal(config.supportUrl),
      label: locale.getText('menuSupport'),
    },
    {
      click: () => shell.openExternal(EnvironmentUtil.web.getWebsiteUrl()),
      label: locale.getText('menuAppURL'),
    },
    downloadLogsTemplate,
  ],
};

const darwinTemplate: MenuItemConstructorOptions = {
  label: `&${config.name}`,
  submenu: [
    aboutTemplate,
    separatorTemplate,
    {
      accelerator: 'Command+,',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.PREFERENCES.SHOW),
      label: locale.getText('menuPreferences'),
    },
    separatorTemplate,
    localeTemplate,
    {
      label: locale.getText('menuServices'),
      role: 'services',
      submenu: [],
    },
    separatorTemplate,
    {
      label: locale.getText('menuHideApp'),
      role: 'hide',
    },
    {
      label: locale.getText('menuHideOthers'),
      role: 'hideOthers',
    },
    {
      label: locale.getText('menuShowAll'),
      role: 'unhide',
    },
    separatorTemplate,
    spellingTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Command+Q',
      click: () => lifecycle.quit(),
      label: locale.getText('menuQuit'),
    },
  ],
};

const win32Template: MenuItemConstructorOptions = {
  label: `&${config.name}`,
  submenu: [
    {
      accelerator: 'Ctrl+,',
      click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.PREFERENCES.SHOW),
      label: locale.getText('menuSettings'),
    },
    localeTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    spellingTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Alt+F4',
      click: () => lifecycle.quit(),
      label: locale.getText('menuQuit'),
    },
  ],
};

const linuxTemplate: MenuItemConstructorOptions = {
  label: `&${config.name}`,
  submenu: [
    toggleAutoLaunchTemplate,
    separatorTemplate,
    localeTemplate,
    separatorTemplate,
    spellingTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Ctrl+Q',
      click: () => lifecycle.quit(),
      label: locale.getText('menuQuit'),
    },
  ],
};

const processMenu = (template: Iterable<MenuItemConstructorOptions>, language: locale.SupportedI18nLanguage): void => {
  for (const item of template) {
    if (item.submenu) {
      processMenu(item.submenu as Iterable<MenuItemConstructorOptions>, language);
    }

    if (locale.SUPPORTED_LANGUAGES[language] === item.label) {
      item.checked = true;
    }
  }
};

const showRestartMessageBox = async () => {
  const {response} = await dialog.showMessageBox({
    buttons: [
      locale.getText('restartLater'),
      EnvironmentUtil.platform.IS_MAC_OS ? locale.getText('menuQuit') : locale.getText('restartNow'),
    ],
    message: locale.getText('restartLocale'),
    title: locale.getText('restartNeeded'),
    type: 'info',
  });
  if (response === 1) {
    await (EnvironmentUtil.platform.IS_MAC_OS ? lifecycle.quit() : lifecycle.relaunch());
  }
};

const changeLocale = async (language: locale.SupportedI18nLanguage): Promise<void> => {
  locale.setLocale(language);
  await showRestartMessageBox();
};

export const createMenu = (isFullScreen: boolean): Menu => {
  const menuTemplate = [conversationTemplate, editTemplate, windowTemplate, helpTemplate];

  if (EnvironmentUtil.platform.IS_MAC_OS) {
    menuTemplate.unshift(darwinTemplate);
    if (Array.isArray(windowTemplate.submenu)) {
      windowTemplate.submenu.push(separatorTemplate, showWireTemplate, separatorTemplate, toggleFullScreenTemplate);
    }
    toggleFullScreenTemplate.checked = isFullScreen;
  }

  if (EnvironmentUtil.platform.IS_WINDOWS) {
    menuTemplate.unshift(win32Template);
    windowTemplate.label = locale.getText('menuView');
    if (Array.isArray(windowTemplate.submenu)) {
      windowTemplate.submenu.unshift(toggleMenuTemplate, separatorTemplate);
    }
  }

  if (EnvironmentUtil.platform.IS_LINUX && Array.isArray(windowTemplate.submenu)) {
    const muteAccelerator = 'Ctrl+Alt+M';

    const muteShortcut: MenuItemConstructorOptions = {
      accelerator: muteAccelerator,
      click: () =>
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.TOGGLE_MUTE),
      label: 'Toggle mute',
      visible: false,
    };

    const switchShortcuts: MenuItemConstructorOptions[] = Array.from(
      {length: config.maximumAccounts},
      (_key, index) => {
        const switchAccelerator = `Ctrl+${index + 1}`;

        return {
          accelerator: switchAccelerator,
          click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, index),
          label: `Switch to Account ${index + 1}`,
          visible: false,
        };
      },
    );

    windowTemplate.submenu.push(muteShortcut, ...switchShortcuts);

    menuTemplate.unshift(linuxTemplate);
    if (Array.isArray(editTemplate.submenu)) {
      editTemplate.submenu.push(separatorTemplate, {
        accelerator: 'Ctrl+,',
        click: () => WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.PREFERENCES.SHOW),
        label: locale.getText('menuPreferences'),
      });
    }
    if (Array.isArray(windowTemplate.submenu)) {
      windowTemplate.submenu.push(separatorTemplate, toggleMenuTemplate, separatorTemplate, toggleFullScreenTemplate);
    }
    toggleFullScreenTemplate.checked = isFullScreen;
  }

  if (!EnvironmentUtil.platform.IS_MAC_OS) {
    if (Array.isArray(helpTemplate.submenu)) {
      helpTemplate.submenu.push(separatorTemplate, aboutTemplate);
    }
  }

  processMenu(menuTemplate, locale.getCurrent());
  return Menu.buildFromTemplate(menuTemplate);
};

export const toggleMenuBar = (): void => {
  const mainBrowserWindow = WindowManager.getPrimaryWindow();

  if (mainBrowserWindow) {
    const autoHide = mainBrowserWindow.isMenuBarAutoHide();
    mainBrowserWindow.setAutoHideMenuBar(!autoHide);
    mainBrowserWindow.setMenuBarVisibility(autoHide);
    settings.save(SettingsType.SHOW_MENU_BAR, autoHide);
  }
};

export const toggleSpellChecking = async (): Promise<void> => {
  const enableSpellChecking = settings.restore(SettingsType.ENABLE_SPELL_CHECKING, true);
  settings.save(SettingsType.ENABLE_SPELL_CHECKING, !enableSpellChecking);
  await showRestartMessageBox();
};

export const registerGlobalShortcuts = (): void => {
  if (!EnvironmentUtil.platform.IS_LINUX) {
    const muteAccelerator = 'CmdOrCtrl+Alt+M';
    logger.info(`Registering global mute shortcut "${muteAccelerator}" ...`);

    globalShortcut.register(muteAccelerator, () =>
      WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.UI.SYSTEM_MENU, EVENT_TYPE.CONVERSATION.TOGGLE_MUTE),
    );

    Array.from({length: config.maximumAccounts}, (_key, index) => {
      const switchAccelerator = `CmdOrCtrl+${index + 1}`;
      logger.info(`Registering global account switching shortcut "${switchAccelerator}" ...`);

      globalShortcut.register(switchAccelerator, () => {
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, index);
      });
    });
  }
};

export const unregisterGlobalShortcuts = (): void => {
  if (!EnvironmentUtil.platform.IS_LINUX) {
    logger.info('Unregistering all global shortcuts ...');
    globalShortcut.unregisterAll();
  }
};
