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

const {remote} = require('electron');
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

module.exports = {
  fromElement: function(contextMenuElement) {
    let menu = new Menu();
    let elements = contextMenuElement.querySelectorAll('[data-context-action]');

    Array.from(elements).forEach(function(element) {
      let menuItem = new MenuItem({
        label: element.innerText,
        click: function() {
          let tag = contextMenuElement.getAttribute('data-context-tag');
          let data = contextMenuElement.getAttribute('data-context-data');
          let action = element.getAttribute('data-context-action');
          amplify.publish(z.event.WebApp.CONTEXT_MENU, tag, action, data);
        },
      });
      menu.append(menuItem);
    });

    return menu;
  },
};
