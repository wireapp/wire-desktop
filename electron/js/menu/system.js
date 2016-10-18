/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

const {app, shell, BrowserWindow, dialog, Menu} = require('electron');

const config = require('./../config');
const init = require('./../lib/init');
const locale = require('./../../locale/locale');

let menu;
var menuTemplate;

function getBrowserWindow() {
  return BrowserWindow.getFocusedWindow();
}

// TODO: disable menus when not in focus
function sendAction(action) {
  const window = getBrowserWindow();
  if (window) {
    getBrowserWindow().webContents.send(action);
  }
}

var separatorTemplate = {
  type: 'separator',
};

var localeTemplate = {
  i18n: 'menuLocale',
  submenu: [
    {
      i18n: 'menuLocaleLangEn',
      type: 'radio',
      click: function() {
        changeLocale('en');
      },
    }, {
      i18n: 'menuLocaleLangDe',
      type: 'radio',
      click: function() {
        changeLocale('de');
      },
    }, {
      i18n: 'menuLocaleLangEs',
      type: 'radio',
      click: function() {
        changeLocale('es');
      },
    },
  ],
};

var startupTemplate = {
  i18n: 'menuStartup',
  type: 'checkbox',
  click: function() {
    const squirrel = require('./../squirrel');
    let checked = menu.items[0].submenu.items[2].checked;
    if (checked) {
      squirrel.createStartupShortcut();
    } else {
      squirrel.removeStartupShortcut();
    }
  },
};

var aboutTemplate = {
  i18n: 'menuAbout',
  click: function() {menu.emit('about-wire');},
};

var signOutTemplate = {
  i18n: 'menuSignOut',
  click: function() {sendAction('sign-out');},
};

var conversationTemplate = {
  i18n: 'menuConversation',
  submenu: [
    {
      i18n: 'menuStart',
      accelerator: 'CmdOrCtrl+N',
      click: function() {sendAction('conversation-start');},
    }, separatorTemplate, {
      i18n: 'menuPing',
      accelerator: 'CmdOrCtrl+K',
      click: function() {sendAction('conversation-ping');},
    }, {
      i18n: 'menuCall',
      click: function() {sendAction('conversation-call');},
    }, {
      i18n: 'menuVideoCall',
      click: function() {sendAction('conversation-video-call');},
    }, separatorTemplate, {
      i18n: 'menuPeople',
      accelerator: 'CmdOrCtrl+I',
      click: function() {sendAction('conversation-people');},
    }, {
      i18n: 'menuAddPeople',
      accelerator: 'Shift+CmdOrCtrl+K',
      click: function() {sendAction('conversation-add-people');},
    }, separatorTemplate, {
      i18n: 'menuArchive',
      accelerator: 'CmdOrCtrl+D',
      click: function() {sendAction('conversation-archive');},
    }, {
      i18n: 'menuMute',
      accelerator: 'Alt+CmdOrCtrl+S',
      click: function() {sendAction('conversation-silence');},
    }, {
      i18n: 'menuDelete',
      click: function() {sendAction('conversation-delete');},
    },
  ],
};

var showWireTemplate = {
  label: config.NAME,
  accelerator: 'CmdOrCtrl+1',
  click: function() {BrowserWindow.getAllWindows()[0].show();},
};

var toggleMenuTemplate = {
  i18n: 'menuShowHide',
  click: function() {
    if (getBrowserWindow().isMenuBarAutoHide()) {
      getBrowserWindow().setAutoHideMenuBar(false);
    } else {
      getBrowserWindow().setAutoHideMenuBar(true);
      getBrowserWindow().setMenuBarVisibility(false);
    }
  },
};

var toggleFullScreenTemplate = {
  i18n: 'menuFullScreen',
  type: 'checkbox',
  accelerator: process.platform === 'darwin' ? 'Alt+Command+F' : 'F11',
  click: function() {
    getBrowserWindow().setFullScreen(!getBrowserWindow().isFullScreen());
  },
};


var editTemplate = {
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
  ],
};

var windowTemplate = {
  i18n: 'menuWindow',
  role: 'window',
  submenu: [
    {
      i18n: 'menuMinimize',
      role: 'minimize',
    }, {
      i18n: 'menuClose',
      role: 'close',
    }, separatorTemplate, {
      i18n: 'menuNextConversation',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click: function() {sendAction('conversation-next');},
    }, {
      i18n: 'menuPreviousConversation',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: function() {sendAction('conversation-prev');},
    },
  ],
};

var helpTemplate = {
  i18n: 'menuHelp',
  role: 'help',
  submenu: [
    {
      i18n: 'menuLegal',
      click: function() {shell.openExternal(config.WIRE_LEGAL);},
    }, {
      i18n: 'menuPrivacy',
      click: function() {shell.openExternal(config.WIRE_PRIVACY);},
    }, {
      i18n: 'menuLicense',
      click: function() {shell.openExternal(config.WIRE_LICENSES);},
    }, {
      i18n: 'menuSupport',
      click: function() {shell.openExternal(config.WIRE_SUPPORT);},
    }, {
      i18n: 'menuWireURL',
      click: function() {shell.openExternal(config.WIRE);},
    },
  ],
};

var darwinTemplate = {
  label: config.NAME,
  submenu: [
    aboutTemplate,
    separatorTemplate, {
      i18n: 'menuPreferences',
      accelerator: 'Command+,',
      click: function() {sendAction('profile-preferences-show');},
    },
    separatorTemplate,
    localeTemplate,
    {
      i18n: 'menuServices',
      role: 'services',
      submenu: [],
    }, separatorTemplate, {
      i18n: 'menuHideWire',
      role: 'hide',
    }, {
      i18n: 'menuHideOthers',
      role: 'hideothers',
    }, {
      i18n: 'menuShowAll',
      role: 'unhide',
    },
    separatorTemplate,
    signOutTemplate, {
      i18n: 'menuQuit',
      accelerator: 'Command+Q',
      selector: 'terminate:',
    },
  ],
};

var win32Template = {
  label: config.NAME,
  submenu: [
    {
      i18n: 'menuSettings',
      accelerator: 'Ctrl+,',
      click: function() {sendAction('profile-settings-show');},
    },
    localeTemplate,
    startupTemplate,
    separatorTemplate,
    signOutTemplate, {
      i18n: 'menuQuit',
      accelerator: 'Alt+F4',
      click: function() {app.quit();},
    },
  ],
};

var linuxTemplate = {
  label: config.NAME,
  submenu: [
    {
      i18n: 'menuPreferences',
      click: function() {sendAction('profile-settings-show');},
    },
    separatorTemplate,
    localeTemplate,
    separatorTemplate,
    signOutTemplate, {
      i18n: 'menuQuit',
      accelerator: 'Ctrl+Q',
      click: function() {app.quit();},
    },
  ],
};

menuTemplate = [
  conversationTemplate,
  editTemplate,
  windowTemplate,
  helpTemplate,
];

if (process.platform === 'darwin') {
  menuTemplate.unshift(darwinTemplate);
  windowTemplate.submenu.push(
    separatorTemplate,
    showWireTemplate,
    separatorTemplate,
    toggleFullScreenTemplate
  );
  toggleFullScreenTemplate.checked = init.restore('fullscreen', false);
}

if (process.platform === 'win32') {
  const squirrel = require('./../squirrel');
  menuTemplate.unshift(win32Template);
  windowTemplate['i18n'] = 'menuView';
  windowTemplate.submenu.unshift(
    toggleMenuTemplate,
    separatorTemplate
  );
  squirrel.startupLinkExists(function(exists) {
    menu.items[0].submenu.items[2].checked = exists;
  });
}

if (process.platform === 'linux') {
  menuTemplate.unshift(linuxTemplate);
  editTemplate.submenu.push(separatorTemplate, {
    i18n: 'menuPreferences',
    click: function() {sendAction('profile-settings-show');},
  });
  windowTemplate.submenu.push(
    separatorTemplate,
    toggleFullScreenTemplate
  );
  toggleFullScreenTemplate.checked = init.restore('fullscreen', false);
}

if (process.platform !== 'darwin') {
  helpTemplate.submenu.push(separatorTemplate, aboutTemplate);
}

function processMenu(template, language) {
  var strings = locale[language];
  for (let item of template) {
    if (item.submenu != null) {
      processMenu(item.submenu, language);
    }
    if (item.i18n != null && strings[item.i18n] != null) {
      item.label = strings[item.i18n];

      if (item.i18n.includes('menuLocaleLang')) {
        var lang = item.i18n.substr(14).toLowerCase();
        if (lang == language) {
          item.checked = true;
        }
      }
    }
  }
}


function changeLocale(language) {
  locale.setLocale(language);
  dialog.showMessageBox({
    type: 'info',
    title: locale[language].restartNeeded,
    message: locale[language].restartLocale,
    buttons: [locale[language].restartLater, locale[language].restartNow],
  }, function(response) {
    if (response == 1) {
      app.quit();
      app.relaunch();
    }
  });
}

processMenu(menuTemplate, locale.getCurrent());

module.exports = menu = Menu.buildFromTemplate(menuTemplate);
