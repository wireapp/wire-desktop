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

const {clipboard, remote, ipcRenderer, webFrame} = require('electron');
const Menu = remote.Menu;
const webContents = remote.getCurrentWebContents();

const config = require('./../config');
const locale = require('./../../locale/locale');
const settings = require('./../settings/ConfigurationPersistence');
const EVENT_TYPE = require('./../lib/eventType');
const SettingsType = require('./../settings/SettingsType');

let textMenu;

///////////////////////////////////////////////////////////////////////////////
// Default
///////////////////////////////////////////////////////////////////////////////

let copyContext = '';

const defaultMenu = Menu.buildFromTemplate([
  {
    click: () => clipboard.writeText(copyContext),
    label: locale.getText('menuCopy'),
  },
]);

///////////////////////////////////////////////////////////////////////////////
// Text
///////////////////////////////////////////////////////////////////////////////

const selection = {
  isMisspelled: false,
  suggestions: [],
};

const textMenuTemplate = [
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
  {
    type: 'separator',
  },
  {
    label: locale.getText('menuSelectAll'),
    role: 'selectall',
  },
];

const createTextMenu = () => {
  const template = textMenuTemplate.slice();

  if (selection.isMisspelled) {
    template.unshift({type: 'separator'});

    if (selection.suggestions.length > 0) {
      for (const suggestion of selection.suggestions.reverse()) {
        template.unshift({
          click: menuItem => webContents.replaceMisspelling(menuItem.label),
          label: suggestion,
        });
      }
    } else {
      template.unshift({
        enabled: false,
        label: locale.getText('menuNoSuggestions'),
      });
    }
  }

  textMenu = Menu.buildFromTemplate(template);
};

///////////////////////////////////////////////////////////////////////////////
// Images
///////////////////////////////////////////////////////////////////////////////

const imageMenu = Menu.buildFromTemplate([
  {
    click: () => savePicture(imageMenu.file, imageMenu.image),
    label: locale.getText('menuSavePictureAs'),
  },
]);

window.addEventListener(
  'contextmenu',
  event => {
    const element = event.target;

    copyContext = '';

    if (element.nodeName === 'TEXTAREA' || element.nodeName === 'INPUT') {
      event.preventDefault();
      createTextMenu();
      textMenu.popup(remote.getCurrentWindow());
    } else if (element.classList.contains('image-element') || element.classList.contains('detail-view-image')) {
      event.preventDefault();
      imageMenu.image = element.src;
      imageMenu.popup(remote.getCurrentWindow());
    } else if (element.nodeName === 'A') {
      event.preventDefault();
      copyContext = element.href.replace(/^mailto:/, '');
      defaultMenu.popup(remote.getCurrentWindow());
    } else if (element.classList.contains('text')) {
      event.preventDefault();
      copyContext = window.getSelection().toString() || element.innerText.trim();
      defaultMenu.popup(remote.getCurrentWindow());
    } else {
      // Maybe we are in a code block _inside_ an element with the 'text' class?
      // Code block can consist of many tags: CODE, PRE, SPAN, etc.
      let parentNode = element.parentNode;
      while (parentNode !== document && !parentNode.classList.contains('text')) {
        parentNode = parentNode.parentNode;
      }
      if (parentNode !== document) {
        event.preventDefault();
        copyContext = window.getSelection().toString() || parentNode.innerText.trim();
        defaultMenu.popup(remote.getCurrentWindow());
      }
    }
  },
  false
);

const savePicture = (fileName, url) => {
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => ipcRenderer.send(EVENT_TYPE.ACTION.SAVE_PICTURE, fileName, new Uint8Array(arrayBuffer)));
};

///////////////////////////////////////////////////////////////////////////////
// Spell Checker
///////////////////////////////////////////////////////////////////////////////

const isSpellCheckSupported = config.SPELLCHECK.SUPPORTED_LANGUAGES.includes(locale.getCurrent());
if (isSpellCheckSupported) {
  const spellchecker = require('spellchecker');

  webFrame.setSpellCheckProvider(locale.getCurrent(), false, {
    spellCheck(text) {
      const isSpellCheckEnabled = settings.restore(SettingsType.SPELL_CHECK, false);
      if (!isSpellCheckEnabled) {
        return true;
      }

      selection.isMisspelled = spellchecker.isMisspelled(text);
      selection.suggestions = [];
      if (selection.isMisspelled) {
        selection.suggestions = spellchecker.getCorrectionsForMisspelling(text).slice(0, config.SPELLCHECK.SUGGESTIONS);
      }
      return !selection.isMisspelled;
    },
  });
}
