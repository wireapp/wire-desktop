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

'use strict';

const {app, shell, dialog, Menu} = require('electron');
const autoLaunch = require('auto-launch');
const launchCmd = process.env.APPIMAGE != null ? process.env.APPIMAGE : process.execPath;

const config = require('./../config');
const init = require('./../lib/init');
const locale = require('./../../locale/locale');
const windowManager = require('./../window-manager');

let menu;

const launcher = new autoLaunch({
  isHidden: true,
  name: config.NAME,
  path: launchCmd,
});

function getPrimaryWindow() {
  return windowManager.getPrimaryWindow();
}

// TODO: disable menus when not in focus
function sendAction(action) {
  const window = getPrimaryWindow();
  if (window) {
    getPrimaryWindow().webContents.send(action);
  }
}

const separatorTemplate = {
  type: 'separator',
};

const localeTemplate = {
  i18n: 'menuLocale',
  submenu: [
    {
      click() {
        changeLocale('en');
      },
      label: locale.label['en'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('cs');
      },
      label: locale.label['cs'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('da');
      },
      label: locale.label['da'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('de');
      },
      label: locale.label['de'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('es');
      },
      label: locale.label['es'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('fi');
      },
      label: locale.label['fi'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('fr');
      },
      label: locale.label['fr'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('hr');
      },
      label: locale.label['hr'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('hu');
      },
      label: locale.label['hu'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('it');
      },
      label: locale.label['it'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('lt');
      },
      label: locale.label['lt'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('pt');
      },
      label: locale.label['pt'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('ro');
      },
      label: locale.label['ro'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('ru');
      },
      label: locale.label['ru'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('sk');
      },
      label: locale.label['sk'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('sl');
      },
      label: locale.label['sl'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('tr');
      },
      label: locale.label['tr'],
      type: 'radio',
    },
    {
      click() {
        changeLocale('uk');
      },
      label: locale.label['uk'],
      type: 'radio',
    },
  ],
};

const aboutTemplate = {
  click() {
    menu.emit('about-wire');
  },
  i18n: 'menuAbout',
};

const signOutTemplate = {
  click() {
    sendAction('sign-out');
  },
  i18n: 'menuSignOut',
};

const conversationTemplate = {
  i18n: 'menuConversation',
  submenu: [
    {
      accelerator: 'CmdOrCtrl+N',
      click() {
        sendAction('conversation-start');
      },
      i18n: 'menuStart',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+K',
      click() {
        sendAction('conversation-ping');
      },
      i18n: 'menuPing',
    },
    {
      click() {
        sendAction('conversation-call');
      },
      i18n: 'menuCall',
    },
    {
      click() {
        sendAction('conversation-video-call');
      },
      i18n: 'menuVideoCall',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+I',
      click() {
        sendAction('conversation-people');
      },
      i18n: 'menuPeople',
    },
    {
      accelerator: 'Shift+CmdOrCtrl+K',
      click() {
        sendAction('conversation-add-people');
      },
      i18n: 'menuAddPeople',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+D',
      click() {
        sendAction('conversation-archive');
      },
      i18n: 'menuArchive',
    },
    {
      accelerator: 'Alt+CmdOrCtrl+M',
      click() {
        sendAction('conversation-silence');
      },
      i18n: 'menuMute',
    },
    {
      click() {
        sendAction('conversation-delete');
      },
      i18n: 'menuDelete',
    },
  ],
};

const showWireTemplate = {
  accelerator: 'CmdOrCtrl+1',
  click() {
    getPrimaryWindow().show();
  },
  label: config.NAME,
};

const toggleMenuTemplate = {
  checked: init.restore('showMenu', true),
  click() {
    const mainBrowserWindow = getPrimaryWindow();
    if (mainBrowserWindow.isMenuBarAutoHide()) {
      mainBrowserWindow.setAutoHideMenuBar(false);
      init.save('showMenu', true);
    } else {
      mainBrowserWindow.setAutoHideMenuBar(true);
      mainBrowserWindow.setMenuBarVisibility(false);
      init.save('showMenu', false);
    }
  },
  i18n: 'menuShowHide',
  type: 'checkbox',
};

const toggleFullScreenTemplate = {
  accelerator: process.platform === 'darwin' ? 'Alt+Command+F' : 'F11',
  click() {
    const mainBrowserWindow = getPrimaryWindow();
    mainBrowserWindow.setFullScreen(!mainBrowserWindow.isFullScreen());
  },
  i18n: 'menuFullScreen',
  type: 'checkbox',
};

const toggleAutoLaunchTemplate = {
  checked: init.restore('shouldAutoLaunch', false),
  click() {
    init.save('shouldAutoLaunch', !init.restore('shouldAutoLaunch'));
    init.restore("shouldAutoLaunch") ? launcher.enable() : launcher.disable(); // eslint-disable-line
  },
  i18n: 'menuStartup',
  type: 'checkbox',
};

const editTemplate = {
  i18n: 'menuEdit',
  submenu: [
    {i18n: 'menuUndo', role: 'undo'},
    {i18n: 'menuRedo', role: 'redo'},
    separatorTemplate,
    {i18n: 'menuCut', role: 'cut'},
    {i18n: 'menuCopy', role: 'copy'},
    {i18n: 'menuPaste', role: 'paste'},
    separatorTemplate,
    {i18n: 'menuSelectAll', role: 'selectall'},
    separatorTemplate,
    {
      checked: init.restore('spelling', false) && config.SPELL_SUPPORTED.indexOf(locale.getCurrent()) > -1,
      click(event) {
        init.save('spelling', event.checked);
      },
      enabled: config.SPELL_SUPPORTED.indexOf(locale.getCurrent()) > -1,
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
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click() {
        sendAction('conversation-next');
      },
      i18n: 'menuNextConversation',
    },
    {
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click() {
        sendAction('conversation-prev');
      },
      i18n: 'menuPreviousConversation',
    },
  ],
};

const helpTemplate = {
  i18n: 'menuHelp',
  role: 'help',
  submenu: [
    {
      click() {
        shell.openExternal(config.WIRE_LEGAL);
      },
      i18n: 'menuLegal',
    },
    {
      click() {
        shell.openExternal(config.WIRE_PRIVACY);
      },
      i18n: 'menuPrivacy',
    },
    {
      click() {
        shell.openExternal(config.WIRE_LICENSES);
      },
      i18n: 'menuLicense',
    },
    {
      click() {
        shell.openExternal(config.WIRE_SUPPORT);
      },
      i18n: 'menuSupport',
    },
    {
      click() {
        shell.openExternal(config.WIRE);
      },
      i18n: 'menuWireURL',
    },
  ],
};

const darwinTemplate = {
  label: config.NAME,
  submenu: [
    aboutTemplate,
    separatorTemplate,
    {
      accelerator: 'Command+,',
      click() {
        sendAction('preferences-show');
      },
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
      click() {
        sendAction('preferences-show');
      },
      i18n: 'menuSettings',
    },
    localeTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Alt+F4',
      click() {
        app.quit();
      },
      i18n: 'menuQuit',
    },
  ],
};

const linuxTemplate = {
  label: config.NAME,
  submenu: [
    {
      click() {
        sendAction('preferences-show');
      },
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
      click() {
        app.quit();
      },
      i18n: 'menuQuit',
    },
  ],
};

const menuTemplate = [conversationTemplate, editTemplate, windowTemplate, helpTemplate];

function processMenu(template, language) {
  for (const item of template) {
    if (item.submenu != null) {
      processMenu(item.submenu, language);
    }
    if (locale.label[language] === item.label) {
      item.checked = true;
    }
    if (item.i18n != null) {
      item.label = locale.getText(item.i18n);
    }
  }
}

function changeLocale(language) {
  locale.setLocale(language);
  dialog.showMessageBox(
    {
      buttons: [
        locale[language].restartLater,
        process.platform === 'darwin' ? locale[language].menuQuit : locale[language].restartNow,
      ],
      message: locale[language].restartLocale,
      title: locale[language].restartNeeded,
      type: 'info',
    },
    function(response) {
      if (response == 1) {
        if (process.platform !== 'darwin') {
          app.relaunch();
        }
        // Using exit instead of quit for the time being
        // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
        app.exit();
      }
    },
  );
}

module.exports = {
  createMenu() {
    if (process.platform === 'darwin') {
      menuTemplate.unshift(darwinTemplate);
      windowTemplate.submenu.push(separatorTemplate, showWireTemplate, separatorTemplate, toggleFullScreenTemplate);
      toggleFullScreenTemplate.checked = init.restore('fullscreen', false);
    }

    if (process.platform === 'win32') {
      menuTemplate.unshift(win32Template);
      windowTemplate['i18n'] = 'menuView';
      windowTemplate.submenu.unshift(toggleMenuTemplate, separatorTemplate);
    }

    if (process.platform === 'linux') {
      menuTemplate.unshift(linuxTemplate);
      editTemplate.submenu.push(separatorTemplate, {
        click() {
          sendAction('preferences-show');
        },
        i18n: 'menuPreferences',
      });
      windowTemplate.submenu.push(separatorTemplate, toggleMenuTemplate, separatorTemplate, toggleFullScreenTemplate);
      toggleFullScreenTemplate.checked = init.restore('fullscreen', false);
    }

    if (process.platform !== 'darwin') {
      helpTemplate.submenu.push(separatorTemplate, aboutTemplate);
    }

    processMenu(menuTemplate, locale.getCurrent());
    menu = Menu.buildFromTemplate(menuTemplate);

    return menu;
  },
};
