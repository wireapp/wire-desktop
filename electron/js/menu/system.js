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
  isHidden: true,
  name: config.NAME,
  path: launchCmd,
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
    click: () => changeLocale(languageCode),
    label: locale.SUPPORTED_LANGUAGES[languageCode],
    type: 'radio',
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
  click: () => menu.emit('about-wire'),
  i18n: 'menuAbout',
};

const signOutTemplate = {
  click: () => sendAction('sign-out'),
  i18n: 'menuSignOut',
};

const conversationTemplate = {
  i18n: 'menuConversation',
  submenu: [
    {
      accelerator: 'CmdOrCtrl+N',
      click: () => sendAction('conversation-start'),
      i18n: 'menuStart',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+K',
      click: () => sendAction('conversation-ping'),
      i18n: 'menuPing',
    }, {
      click: () => sendAction('conversation-call'),
      i18n: 'menuCall',
    }, {
      click: () => sendAction('conversation-video-call'),
      i18n: 'menuVideoCall',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+I',
      click: () => sendAction('conversation-people'),
      i18n: 'menuPeople',
    },
    {
      accelerator: 'Shift+CmdOrCtrl+K',
      click: () => sendAction('conversation-add-people'),
      i18n: 'menuAddPeople',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+D',
      click: () => sendAction('conversation-archive'),
      i18n: 'menuArchive',
    },
    {
      accelerator: 'CmdOrCtrl+Alt+M',
      click: () => sendAction('conversation-silence'),
      i18n: 'menuMute',
    },
    {
      click: () => sendAction('conversation-delete'),
      i18n: 'menuDelete',
    },
  ],
};

const showWireTemplate = {
  accelerator: 'CmdOrCtrl+0',
  click: () => getPrimaryWindow().show(),
  label: config.NAME,
};

const toggleMenuTemplate = {
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
  i18n: 'menuShowHide',
  type: 'checkbox',
};

const toggleFullScreenTemplate = {
  accelerator: environment.platform.IS_MAC_OS ? 'Alt+Command+F' : 'F11',
  click: () => {
    const mainBrowserWindow = getPrimaryWindow();
    mainBrowserWindow.setFullScreen(!mainBrowserWindow.isFullScreen());
  },
  i18n: 'menuFullScreen',
  type: 'checkbox',
};

const toggleAutoLaunchTemplate = {
  checked: settings.restore('shouldAutoLaunch', false),
  click: () => {
    settings.save('shouldAutoLaunch', !settings.restore('shouldAutoLaunch'));
    settings.restore('shouldAutoLaunch') ? launcher.enable() : launcher.disable(); // eslint-disable-line
  },
  i18n: 'menuStartup',
  type: 'checkbox',
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
      checked: supportsSpellcheck && settings.restore('spelling', false),
      click: (event) => settings.save('spelling', event.checked),
      enabled: supportsSpellcheck,
      i18n: 'menuSpelling',
      type: 'checkbox',
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
      accelerator: environment.platform.IS_MAC_OS ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click: () => sendAction('conversation-next'),
      i18n: 'menuNextConversation',
    },
    {
      accelerator: environment.platform.IS_MAC_OS ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: () => sendAction('conversation-prev'),
      i18n: 'menuPreviousConversation',
    },
  ],
};

const helpTemplate = {
  i18n: 'menuHelp',
  role: 'help',
  submenu: [
    {
      click: () => shell.openExternal(environment.web.get_url_website() + config.URL.LEGAL),
      i18n: 'menuLegal',
    },
    {
      click: () => shell.openExternal(environment.web.get_url_website() + config.URL.PRIVACY),
      i18n: 'menuPrivacy',
    },
    {
      click: () => shell.openExternal(environment.web.get_url_website() + config.URL.LICENSES),
      i18n: 'menuLicense',
    },
    {
      click: () => shell.openExternal(environment.web.get_url_support()),
      i18n: 'menuSupport',
    },
    {
      click: () => shell.openExternal(environment.web.get_url_website()),
      i18n: 'menuWireURL',
    },
  ],
};

const darwinTemplate = {
  label: config.NAME,
  submenu: [
    aboutTemplate,
    separatorTemplate, {
      accelerator: 'Command+,',
      click: () => sendAction('preferences-show'),
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

const win32Template = {
  label: config.NAME,
  submenu: [
    {
      accelerator: 'Ctrl+,',
      click: () => sendAction('preferences-show'),
      i18n: 'menuSettings',
    },
    localeTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Alt+F4',
      click: () => app.quit(),
      i18n: 'menuQuit',
    },
  ],
};

const linuxTemplate = {
  label: config.NAME,
  submenu: [
    {
      click: () => sendAction('preferences-show'),
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
      click: () => app.quit(),
      i18n: 'menuQuit',
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
    buttons: [locale[language].restartLater, environment.platform.IS_MAC_OS ? locale[language].menuQuit : locale[language].restartNow],
    message: locale[language].restartLocale,
    title: locale[language].restartNeeded,
    type: 'info',
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
        click: () => sendAction('preferences-show'),
        i18n: 'menuPreferences',
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
