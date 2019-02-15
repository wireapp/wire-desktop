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

import {clipboard, ipcRenderer, remote} from 'electron';
const Menu = remote.Menu;

import {ElectronMenuWithFileAndImage} from '../../interfaces';
import * as config from '../../js/config';
import {EVENT_TYPE} from '../../lib/eventType';
import * as locale from '../../locale/locale';

let textMenu: Electron.Menu;

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

const textMenuTemplate: Electron.MenuItemConstructorOptions[] = [
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
  textMenu = Menu.buildFromTemplate(template);
};

///////////////////////////////////////////////////////////////////////////////
// Images
///////////////////////////////////////////////////////////////////////////////

const imageMenu: ElectronMenuWithFileAndImage = Menu.buildFromTemplate([
  {
    click: () => savePicture(imageMenu.file || '', imageMenu.image || ''),
    label: locale.getText('menuSavePictureAs'),
  },
]);

window.addEventListener(
  'contextmenu',
  event => {
    const element = event.target as HTMLElement;

    copyContext = '';

    if (element.nodeName === 'TEXTAREA' || element.nodeName === 'INPUT') {
      event.preventDefault();

      createTextMenu();
      textMenu.popup({window: remote.getCurrentWindow()});
    } else if (element.classList.contains('image-element') || element.classList.contains('detail-view-image')) {
      event.preventDefault();
      const elementSource = (element as HTMLImageElement).src;
      imageMenu.image = elementSource;
      imageMenu.popup({window: remote.getCurrentWindow()});
    } else if (element.nodeName === 'A') {
      event.preventDefault();

      const elementHref = (element as HTMLLinkElement).href;
      copyContext = elementHref.replace(/^mailto:/, '');
      defaultMenu.popup({window: remote.getCurrentWindow()});
    } else if (element.classList.contains('text')) {
      event.preventDefault();

      copyContext = window.getSelection().toString() || element.innerText.trim();
      defaultMenu.popup({window: remote.getCurrentWindow()});
    } else {
      // Maybe we are in a code block _inside_ an element with the 'text' class?
      // Code block can consist of many tags: CODE, PRE, SPAN, etc.
      let parentNode = element.parentNode;
      while (parentNode && parentNode !== document && !(parentNode as HTMLElement).classList.contains('text')) {
        parentNode = parentNode.parentNode;
      }
      if (parentNode !== document) {
        event.preventDefault();
        copyContext = window.getSelection().toString() || (parentNode as HTMLElement).innerText.trim();
        defaultMenu.popup({window: remote.getCurrentWindow()});
      }
    }
  },
  false
);

const savePicture = (fileName: string, url: RequestInfo) => {
  return fetch(url, {
    headers: {
      'User-Agent': config.USER_AGENT,
    },
  })
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => ipcRenderer.send(EVENT_TYPE.ACTION.SAVE_PICTURE, fileName, new Uint8Array(arrayBuffer)));
};
