/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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


const {app, dialog, Menu, shell} = require('electron');
const autoLaunch = require('auto-launch');
const launchCmd = process.env.APPIMAGE ? process.env.APPIMAGE : process.execPath;

const config = require('./../config');
const environment = require('./../environment');
const locale = require('./../../locale/locale');
const windowManager = require('./../window-manager');
const settings = require('./../lib/settings');

let menu;

const launcher = new autoLaunch({
  name: config.NAME,
  path: launchCmd,
  isHidden: true,
});


const getPrimaryWindow = () => windowManager.getPrimaryWindow();

// TODO: disable menus when not in focus
const sendAction = (action) => {
  const primaryWindow = getPrimaryWindow();
  if (primaryWindow) {
    getPrimaryWindow().webContents.send('system-menu', action);
  }
};


const separatorTemplate = {
  type: 'separator',
};


const createLanguageTemplate = (languageCode) => {
  return {
    label: locale.SUPPORTED_LANGUAGES[languageCode],
    type: 'radio',
    click: () => changeLocale(languageCode),
  };
};

const createLanguageSubmenu = ()=> {
  return Object.keys(locale.SUPPORTED_LANGUAGES)
    .map((supportedLanguage) => createLanguageTemplate(supportedLanguage));
};

const localeTemplate = {
  i18n: 'menuLocale',
  submenu: createLanguageSubmenu(),
};

const aboutTemplate = {
  i18n: 'menuAbout',
  click: () => menu.emit('about-wire'),
};

const signOutTemplate = {
  i18n: 'menuSignOut',
  click: () => sendAction('sign-out'),
};

const conversationTemplate = {
  i18n: 'menuConversation',
  submenu: [
    {
      i18n: 'menuStart',
      accelerator: 'CmdOrCtrl+N',
      click: () => sendAction('conversation-start'),
    },
    separatorTemplate,
    {
      i18n: 'menuPing',
      accelerator: 'CmdOrCtrl+K',
      click: () => sendAction('conversation-ping'),
    }, {
      i18n: 'menuCall',
      click: () => sendAction('conversation-call'),
    }, {
      i18n: 'menuVideoCall',
      click: () => sendAction('conversation-video-call'),
    },
    separatorTemplate,
    {
      i18n: 'menuPeople',
      accelerator: 'CmdOrCtrl+I',
      click: () => sendAction('conversation-people'),
    },
    {
      i18n: 'menuAddPeople',
      accelerator: 'Shift+CmdOrCtrl+K',
      click: () => sendAction('conversation-add-people'),
    },
    separatorTemplate,
    {
      i18n: 'menuArchive',
      accelerator: 'CmdOrCtrl+D',
      click: () => sendAction('conversation-archive'),
    },
    {
      i18n: 'menuMute',
      accelerator: 'Alt+CmdOrCtrl+M',
      click: () => sendAction('conversation-silence'),
    },
    {
      i18n: 'menuDelete',
      click: () => sendAction('conversation-delete'),
    },
  ],
};

const showWireTemplate = {
  label: config.NAME,
  accelerator: 'CmdOrCtrl+1',
  click: () => getPrimaryWindow().show(),
};

const toggleMenuTemplate = {
  i18n: 'menuShowHide',
  type: 'checkbox',
  checked: settings.restore('showMenu', true),
  click: () => {
    const mainBrowserWindow = getPrimaryWindow();
    const showMenu = mainBrowserWindow.isMenuBarAutoHide();

    mainBrowserWindow.setAutoHideMenuBar(!showMenu);

    if (!showMenu) {
      mainBrowserWindow.setMenuBarVisibility(showMenu);
    }

    settings.save('showMenu', showMenu);
  },
};

const toggleFullScreenTemplate = {
  i18n: 'menuFullScreen',
  type: 'checkbox',
  accelerator: environment.platform.IS_MAC_OS ? 'Alt+Command+F' : 'F11',
  click: () => {
    const mainBrowserWindow = getPrimaryWindow();
    mainBrowserWindow.setFullScreen(!mainBrowserWindow.isFullScreen());
  },
};

const toggleAutoLaunchTemplate = {
  i18n: 'menuStartup',
  type: 'checkbox',
  checked: settings.restore('shouldAutoLaunch', false),
  click: () => {
    settings.save('shouldAutoLaunch', !settings.restore('shouldAutoLaunch'));
    settings.restore('shouldAutoLaunch') ? launcher.enable() : launcher.disable(); // eslint-disable-line
  },
};

const supportsSpellcheck = config.SPELLCHECK.SUPPORTED_LANGUAGES.includes(locale.getCurrent());

const editTemplate = {
  i18n: 'menuEdit',
  submenu: [
    {
      i18n: 'menuUndo',
      role: 'undo',
    },
    {
      i18n: 'menuRedo',
      role: 'redo',
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
      i18n: 'menuSpelling',
      type: 'checkbox',
      checked: supportsSpellcheck && settings.restore('spelling', false),
      enabled: supportsSpellcheck,
      click: (event) => settings.save('spelling', event.checked),
    },
  ],
};

const windowTemplate = {
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
      i18n: 'menuNextConversation',
      accelerator: environment.platform.IS_MAC_OS ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click: () => sendAction('conversation-next'),
    },
    {
      i18n: 'menuPreviousConversation',
      accelerator: environment.platform.IS_MAC_OS ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: () => sendAction('conversation-prev'),
    },
  ],
};

const helpTemplate = {
  i18n: 'menuHelp',
  role: 'help',
  submenu: [
    {
      i18n: 'menuLegal',
      click: () => shell.openExternal(environment.web.get_url_support() + config.URL.LEGAL),
    },
    {
      i18n: 'menuPrivacy',
      click: () => shell.openExternal(environment.web.get_url_support() + config.URL.PRIVACY),
    },
    {
      i18n: 'menuLicense',
      click: () => shell.openExternal(environment.web.get_url_support() + config.URL.LICENSES),
    },
    {
      i18n: 'menuSupport',
      click: () => shell.openExternal(environment.web.get_url_support()),
    },
    {
      i18n: 'menuWireURL',
      click: () => shell.openExternal(environment.web.get_url_website()),
    },
  ],
};

const darwinTemplate = {
  label: config.NAME,
  submenu: [
    aboutTemplate,
    separatorTemplate, {
      i18n: 'menuPreferences',
      accelerator: 'Command+,',
      click: () => sendAction('preferences-show'),
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
      i18n: 'menuQuit',
      accelerator: 'Command+Q',
      selector: 'terminate:',
    },
  ],
};

const win32Template = {
  label: config.NAME,
  submenu: [
    {
      i18n: 'menuSettings',
      accelerator: 'Ctrl+,',
      click: () => sendAction('preferences-show'),
    },
    localeTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      i18n: 'menuQuit',
      accelerator: 'Alt+F4',
      click: () => app.quit(),
    },
  ],
};

const linuxTemplate = {
  label: config.NAME,
  submenu: [
    {
      i18n: 'menuPreferences',
      click: () => sendAction('preferences-show'),
    },
    separatorTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    localeTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      i18n: 'menuQuit',
      accelerator: 'Ctrl+Q',
      click: () => app.quit(),
    },
  ],
};

const menuTemplate = [
  conversationTemplate,
  editTemplate,
  windowTemplate,
  helpTemplate,
];


const processMenu = (template, language) => {
  for (const item of template) {
    if (item.submenu) {
      processMenu(item.submenu, language);
    }

    if (locale.SUPPORTED_LANGUAGES[language] === item.label) {
      item.checked = true;
    }

    if (item.i18n) {
      item.label = locale.getText(item.i18n);
    }
  }
};


const changeLocale = (language) => {
  locale.setLocale(language);
  dialog.showMessageBox({
    type: 'info',
    title: locale[language].restartNeeded,
    message: locale[language].restartLocale,
    buttons: [locale[language].restartLater, environment.platform.IS_MAC_OS ? locale[language].menuQuit : locale[language].restartNow],
  }, (response) => {
    if (response === 1) {
      if (environment.platform.IS_MAC_OS) {
        app.quit();
      } else {
        app.relaunch();
        // Using exit instead of quit for the time being
        // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
        app.exit();
      }
    }
  });
};


module.exports = {
  createMenu: () => {
    if (environment.platform.IS_MAC_OS) {
      menuTemplate.unshift(darwinTemplate);
      windowTemplate.submenu.push(
        separatorTemplate,
        showWireTemplate,
        separatorTemplate,
        toggleFullScreenTemplate
      );
      toggleFullScreenTemplate.checked = settings.restore('fullscreen', false);
    }

    if (environment.platform.IS_WINDOWS) {
      menuTemplate.unshift(win32Template);
      windowTemplate['i18n'] = 'menuView';
      windowTemplate.submenu.unshift(
        toggleMenuTemplate,
        separatorTemplate
      );
    }

    if (environment.platform.IS_LINUX) {
      menuTemplate.unshift(linuxTemplate);
      editTemplate.submenu.push(separatorTemplate, {
        i18n: 'menuPreferences',
        click: () => sendAction('preferences-show'),
      });
      windowTemplate.submenu.push(
        separatorTemplate,
        toggleMenuTemplate,
        separatorTemplate,
        toggleFullScreenTemplate
      );
      toggleFullScreenTemplate.checked = settings.restore('fullscreen', false);
    }

    if (!environment.platform.IS_MAC_OS) {
      helpTemplate.submenu.push(separatorTemplate, aboutTemplate);
    }

    processMenu(menuTemplate, locale.getCurrent());
    menu = Menu.buildFromTemplate(menuTemplate);

    return menu;
  },
};
