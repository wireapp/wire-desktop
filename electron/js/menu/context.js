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

const {clipboard, remote, ipcRenderer, webFrame} = require('electron');
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const webContents = remote.getCurrentWebContents();
const config = require('./../config');
const locale = require('./../../locale/locale');
const init = require('./../lib/init');
const customContext = require('./custom-context');
let textMenu;

///////////////////////////////////////////////////////////////////////////////
// Default
///////////////////////////////////////////////////////////////////////////////
let copyContext = '';

const defaultMenu = Menu.buildFromTemplate([{
  label: locale.getText('menuCopy'),
  click: function () {
    clipboard.writeText(copyContext);
  },
}]);

///////////////////////////////////////////////////////////////////////////////
// Text
///////////////////////////////////////////////////////////////////////////////
let selection = {
  isMisspelled: false,
  suggestions: [],
};

const textMenuTemplate = [
  {label: locale.getText('menuCut'), role: 'cut'},
  {label: locale.getText('menuCopy'), role: 'copy'},
  {label: locale.getText('menuPaste'), role: 'paste'},
  {type: 'separator'},
  {label: locale.getText('menuSelectAll'), role: 'selectall'},
];

function createTextMenu() {
  let template = textMenuTemplate.slice();
  if (selection.isMisspelled) {
    template.unshift({type: 'separator'});
    if (selection.suggestions.length > 0) {
      for (let suggestion of selection.suggestions.reverse()) {
        template.unshift({label: suggestion, click: function(menuItem) {
          webContents.replaceMisspelling(menuItem.label);
        }});
      }
    } else {
      template.unshift({label: locale.getText('menuNoSuggestions'), enabled: false});
    }
  }
  textMenu = Menu.buildFromTemplate(template);
}


///////////////////////////////////////////////////////////////////////////////
// Conversation
///////////////////////////////////////////////////////////////////////////////
let silence = new MenuItem({
  label: locale.getText('menuMute'),
  click: function () {
    wire.app.view.conversation_list.click_on_mute_action();
  },
});

let notify = new MenuItem({
  label: locale.getText('menuUnmute'),
  click: function () {
    wire.app.view.conversation_list.click_on_mute_action();
  },
});

let archive = new MenuItem({
  label: locale.getText('menuArchive'),
  click: function() {
    wire.app.view.conversation_list.click_on_archive_action();
  },
});

let unarchive = new MenuItem({
  label: locale.getText('menuUnarchive'),
  click: function() {
    wire.app.view.conversation_list.click_on_unarchive_action();
  },
});

let clear = new MenuItem({
  label: locale.getText('menuDelete'),
  click: function() {
    wire.app.view.conversation_list.click_on_clear_action();
  },
});

let leave = new MenuItem({
  label: locale.getText('menuLeave'),
  click: function() {
    wire.app.view.conversation_list.click_on_leave_action();
  },
});

let block = new MenuItem({
  label: locale.getText('menuBlock'),
  click: function() {
    wire.app.view.conversation_list.click_on_block_action();
  },
});

///////////////////////////////////////////////////////////////////////////////
// Images
///////////////////////////////////////////////////////////////////////////////
let imageMenu = Menu.buildFromTemplate([{
  label: locale.getText('menuSavePictureAs'),
  click: function() {
    savePicture(imageMenu.file, imageMenu.image);
  },
}]);

window.addEventListener('contextmenu', function (event) {
  const element = event.target;
  copyContext = '';
  if (element.nodeName === 'TEXTAREA' || element.nodeName === 'INPUT') {
    event.preventDefault();
    createTextMenu();
    textMenu.popup(remote.getCurrentWindow());
  } else if (element.classList.contains('center-column')) {
    let id = element.getAttribute('data-uie-uid');
    if (createConversationMenu(id)) {
      event.preventDefault();
    }
  } else if (element.classList.contains('image-element') || element.classList.contains('detail-view-image')) {
    event.preventDefault();
    imageMenu.image = element.src;
    imageMenu.popup(remote.getCurrentWindow());
  } else if (element.nodeName === 'A') {
    event.preventDefault();
    copyContext = element.href;
    defaultMenu.popup(remote.getCurrentWindow());
  } else if (element.classList.contains('text')) {
    event.preventDefault();
    copyContext = element.innerText.trim();
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
      copyContext = parentNode.innerText.trim();
      defaultMenu.popup(remote.getCurrentWindow());
    }
  }

}, false);

window.addEventListener('click', function(event) {
  const element = event.target;

  if (element.classList.contains('icon-more') && !element.classList.contains('context-menu') && element.parentElement.previousElementSibling) {
    // get center-column
    const id = element.parentElement.previousElementSibling.getAttribute('data-uie-uid');
    if (createConversationMenu(id)) {
      event.stopPropagation();
    }
  }
}, true);

window.addEventListener('z.components.ContextMenuEvent::CONTEXT_MENU', function(event) {
  const element = event.target;
  customContext.fromElement(element).popup(remote.getCurrentWindow());
  event.stopPropagation();
}, true);


function savePicture(fileName, url) {
  fetch(url)
    .then(function(response) {
      return response.arrayBuffer();
    })
    .then(function(arrayBuffer) {
      const bytes = new Uint8Array(arrayBuffer);
      ipcRenderer.send('save-picture', fileName, bytes);
    });
}


function createConversationMenu(id) {
  const app = wire.app;
  const conversation_et = app.repository.conversation.get_conversation_by_id(id);

  if (conversation_et) {
    app.view.conversation_list.selected_conversation(conversation_et);
    let listMenu = new Menu();
    listMenu.append(conversation_et.is_muted() ? notify : silence);
    listMenu.append(conversation_et.is_archived() ? unarchive : archive);
    listMenu.append(clear);
    if (conversation_et.type() === z.conversation.ConversationType.REGULAR) {
      if (!conversation_et.removed_from_conversation()) {
        listMenu.append(leave);
      }
    } else {
      listMenu.append(block);
    }
    listMenu.popup(remote.getCurrentWindow());
    listMenu.current_conversation = id;
    return true;
  }
  return false;
}


///////////////////////////////////////////////////////////////////////////////
// Spell Checker
///////////////////////////////////////////////////////////////////////////////
if (config.SPELL_SUPPORTED.indexOf(locale.getCurrent()) > -1) {
  const spellchecker = require('spellchecker');
  webFrame.setSpellCheckProvider(locale.getCurrent(), false, {
    spellCheck (text) {
      if (!init.restore('spelling', false)) {
        return true;
      }
      selection.isMisspelled = spellchecker.isMisspelled(text);
      selection.suggestions = [];
      if (selection.isMisspelled) {
        selection.suggestions = spellchecker.getCorrectionsForMisspelling(text).slice(0, config.SPELL_SUGGESTIONS);
      }
      return !selection.isMisspelled;
    },
  });
}
