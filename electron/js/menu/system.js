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
const launchCmd = (process.env.APPIMAGE != null) ? process.env.APPIMAGE : process.execPath;

const config = require('./../config');
const locale = require('./../../locale/locale');
const windowManager = require('./../window-manager');
const settings = require('./../lib/settings');

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
  const primaryWindow = getPrimaryWindow();
  if (primaryWindow) {
    getPrimaryWindow().webContents.send('system-menu', action);
  }
}


const separatorTemplate = {
  type: 'separator',
};

const localeTemplate = {
  i18n: 'menuLocale',
  submenu: [
    {
      click: function() {
        changeLocale('en');
      },
      label: locale.label['en'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('cs');
      },
      label: locale.label['cs'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('da');
      },
      label: locale.label['da'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('de');
      },
      label: locale.label['de'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('el');
      },
      label: locale.label['el'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('es');
      },
      label: locale.label['es'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('fi');
      },
      label: locale.label['fi'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('fr');
      },
      label: locale.label['fr'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('hr');
      },
      label: locale.label['hr'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('hu');
      },
      label: locale.label['hu'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('it');
      },
      label: locale.label['it'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('lt');
      },
      label: locale.label['lt'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('nl');
      },
      label: locale.label['nl'],
      type: 'radio',
    },{
      click: function() {
        changeLocale('pl');
      },
      label: locale.label['pl'],
      type: 'radio',
    },{
      click: function() {
        changeLocale('pt');
      },
      label: locale.label['pt'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('ro');
      },
      label: locale.label['ro'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('ru');
      },
      label: locale.label['ru'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('sk');
      },
      label: locale.label['sk'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('sl');
      },
      label: locale.label['sl'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('tr');
      },
      label: locale.label['tr'],
      type: 'radio',
    }, {
      click: function() {
        changeLocale('uk');
      },
      label: locale.label['uk'],
      type: 'radio',
    },
  ],
};

const aboutTemplate = {
  click: function() {menu.emit('about-wire');},
  i18n: 'menuAbout',
};

const signOutTemplate = {
  click: function() {sendAction('sign-out');},
  i18n: 'menuSignOut',
};

const conversationTemplate = {
  i18n: 'menuConversation',
  submenu: [
    {
      accelerator: 'CmdOrCtrl+N',
      click: function() {sendAction('conversation-start');},
      i18n: 'menuStart',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+K',
      click: function() {sendAction('conversation-ping');},
      i18n: 'menuPing',
    }, {
      click: function() {sendAction('conversation-call');},
      i18n: 'menuCall',
    }, {
      click: function() {sendAction('conversation-video-call');},
      i18n: 'menuVideoCall',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+I',
      click: function() {sendAction('conversation-people');},
      i18n: 'menuPeople',
    },
    {
      accelerator: 'Shift+CmdOrCtrl+K',
      click: function() {sendAction('conversation-add-people');},
      i18n: 'menuAddPeople',
    },
    separatorTemplate,
    {
      accelerator: 'CmdOrCtrl+D',
      click: function() {sendAction('conversation-archive');},
      i18n: 'menuArchive',
    },
    {
      accelerator: 'Alt+CmdOrCtrl+M',
      click: function() {sendAction('conversation-silence');},
      i18n: 'menuMute',
    },
    {
      click: function() {sendAction('conversation-delete');},
      i18n: 'menuDelete',
    },
  ],
};

const showWireTemplate = {
  accelerator: 'CmdOrCtrl+1',
  click: function() {getPrimaryWindow().show();},
  label: config.NAME,
};

const toggleMenuTemplate = {
  checked: settings.restore('showMenu', true),
  click: function() {
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
  accelerator: process.platform === 'darwin' ? 'Alt+Command+F' : 'F11',
  click: function() {
    const mainBrowserWindow = getPrimaryWindow();
    mainBrowserWindow.setFullScreen(!mainBrowserWindow.isFullScreen());
  },
  i18n: 'menuFullScreen',
  type: 'checkbox',
};

const toggleAutoLaunchTemplate = {
  checked: settings.restore('shouldAutoLaunch', false),
  click: function() {
    settings.save('shouldAutoLaunch', !settings.restore('shouldAutoLaunch'));
    settings.restore('shouldAutoLaunch') ? launcher.enable() : launcher.disable(); // eslint-disable-line
  },
  i18n: 'menuStartup',
  type: 'checkbox',
};

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
      checked: settings.restore('spelling', false) && config.SPELL_SUPPORTED.indexOf(locale.getCurrent()) > -1,
      click: function(event) {
        settings.save('spelling', event.checked);
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
      click: function() {sendAction('conversation-next');},
      i18n: 'menuNextConversation',
    },
    {
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: function() {sendAction('conversation-prev');},
      i18n: 'menuPreviousConversation',
    },
  ],
};

const helpTemplate = {
  i18n: 'menuHelp',
  role: 'help',
  submenu: [
    {
      click: function() {shell.openExternal(config.WIRE_LEGAL);},
      i18n: 'menuLegal',
    },
    {
      click: function() {shell.openExternal(config.WIRE_PRIVACY);},
      i18n: 'menuPrivacy',
    },
    {
      click: function() {shell.openExternal(config.WIRE_LICENSES);},
      i18n: 'menuLicense',
    },
    {
      click: function() {shell.openExternal(config.WIRE_SUPPORT);},
      i18n: 'menuSupport',
    },
    {
      click: function() {shell.openExternal(config.WIRE);},
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
      click: function() {sendAction('preferences-show');},
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
      click: function() {sendAction('preferences-show');},
      i18n: 'menuSettings',
    },
    localeTemplate,
    toggleAutoLaunchTemplate,
    separatorTemplate,
    signOutTemplate,
    {
      accelerator: 'Alt+F4',
      click: function() {app.quit();},
      i18n: 'menuQuit',
    },
  ],
};

const linuxTemplate = {
  label: config.NAME,
  submenu: [
    {
      click: function() {sendAction('preferences-show');},
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
      click: function() {app.quit();},
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
  dialog.showMessageBox({
    buttons: [locale[language].restartLater, process.platform === 'darwin' ? locale[language].menuQuit : locale[language].restartNow],
    message: locale[language].restartLocale,
    title: locale[language].restartNeeded,
    type: 'info',
  }, function(response) {
    if (response === 1) {
      if (process.platform === 'darwin') {
        app.quit();
      } else {
        app.relaunch();
        // Using exit instead of quit for the time being
        // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
        app.exit();
      }
    }
  });
}


module.exports = {
  createMenu: function() {
    if (process.platform === 'darwin') {
      menuTemplate.unshift(darwinTemplate);
      windowTemplate.submenu.push(
        separatorTemplate,
        showWireTemplate,
        separatorTemplate,
        toggleFullScreenTemplate
      );
      toggleFullScreenTemplate.checked = settings.restore('fullscreen', false);
    }

    if (process.platform === 'win32') {
      menuTemplate.unshift(win32Template);
      windowTemplate['i18n'] = 'menuView';
      windowTemplate.submenu.unshift(
        toggleMenuTemplate,
        separatorTemplate
      );
    }

    if (process.platform === 'linux') {
      menuTemplate.unshift(linuxTemplate);
      editTemplate.submenu.push(separatorTemplate, {
        click: function() {sendAction('preferences-show');},
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

    if (process.platform !== 'darwin') {
      helpTemplate.submenu.push(separatorTemplate, aboutTemplate);
    }

    processMenu(menuTemplate, locale.getCurrent());
    menu = Menu.buildFromTemplate(menuTemplate);

    return menu;
  },
};
