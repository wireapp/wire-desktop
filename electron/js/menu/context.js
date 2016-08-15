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

const {remote, ipcRenderer} = require('electron');

const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const locale = require('./../../locale/locale');
const customContext = require('./custom-context');

// Default
// =================================================================
var default_menu = Menu.buildFromTemplate([{label: 'Copy', role: 'copy'}]);

// Text
// =================================================================
var text_menu = Menu.buildFromTemplate([
  {label: locale.getText('menuCut'), role: 'cut'},
  {label: locale.getText('menuCopy'), role: 'copy'},
  {label: locale.getText('menuPaste'), role: 'paste'},
  {type: 'separator'},
  {label: locale.getText('menuSelectAll'), role: 'selectall'}
]);

// Conversation
// =================================================================
var silence = new MenuItem({
  label: locale.getText('menuMute'),
  click: function () {
    wire.app.view.conversation_list.click_on_mute_action();
  }
});

var notify = new MenuItem({
  label: locale.getText('menuUnmute'),
  click: function () {
    wire.app.view.conversation_list.click_on_mute_action();
  }
});

var archive = new MenuItem({
  label: locale.getText('menuArchive'),
  click: function() {
    wire.app.view.conversation_list.click_on_archive_action();
  }
});

var unarchive = new MenuItem({
  label: locale.getText('menuUnarchive'),
  click: function() {
    wire.app.view.conversation_list.click_on_unarchive_action();
  }
});

var clear = new MenuItem({
  label: locale.getText('menuDelete'),
  click: function() {
    wire.app.view.conversation_list.click_on_clear_action();
  }
});

var leave = new MenuItem({
  label: locale.getText('menuLeave'),
  click: function() {
    wire.app.view.conversation_list.click_on_leave_action();
  }
});

var block = new MenuItem({
  label: locale.getText('menuBlock'),
  click: function() {
    wire.app.view.conversation_list.click_on_block_action();
  }
});

// Images
// =================================================================
var image_menu = Menu.buildFromTemplate([{
  label: locale.getText('menuSavePictureAs'),
  click: function() {
    savePicture(image_menu.file, image_menu.image);
  }
}]);

window.addEventListener('contextmenu', function (event) {
  const element = event.target;

  if (element.nodeName === 'TEXTAREA' || element.nodeName === 'INPUT') {
    event.preventDefault();
    text_menu.popup(remote.getCurrentWindow());
  } else if (element.classList.contains('center-column')) {
    var id = element.getAttribute('data-uie-uid');
    if (createConversationMenu(id)) {
      event.preventDefault();
    }
  } else if (element.classList.contains('image-element') || element.classList.contains('detail-view-image')) {
    event.preventDefault();
    image_menu.image = element.src;
    image_menu.popup(remote.getCurrentWindow());
  } else if (element.classList.contains('text') || element.nodeName === 'A') {
    event.preventDefault();
    default_menu.popup(remote.getCurrentWindow());
  }

}, false);

window.addEventListener('click', function(event) {
  const element = event.target;

  if (element.classList.contains('icon-more') && element.parentElement.previousElementSibling) {
    // get center-column
    const id = element.parentElement.previousElementSibling.getAttribute('data-uie-uid');
    if (createConversationMenu(id)) {
      event.stopPropagation();
    }
  }
}, true);

window.addEventListener(z.components.ContextMenuEvent.CONTEXT_MENU, function(event) {
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
    let list_menu = new Menu();
    list_menu.append(conversation_et.is_muted() ? notify : silence);
    list_menu.append(conversation_et.is_archived() ? unarchive : archive);
    list_menu.append(clear);
    if (conversation_et.type() === z.conversation.ConversationType.REGULAR) {
      if (!conversation_et.removed_from_conversation()) {
        list_menu.append(leave);
      }
    } else {
      list_menu.append(block);
    }
    list_menu.popup(remote.getCurrentWindow());
    list_menu.current_conversation = id;
    return true;
  }
  return false;
}
