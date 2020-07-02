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

import {clipboard, ipcRenderer, Menu as ElectronMenu, MenuItemConstructorOptions, remote} from 'electron';
const Menu = remote.Menu;

import {EVENT_TYPE} from '../../lib/eventType';
import * as locale from '../../locale/locale';
import {config} from '../../settings/config';

interface ElectronMenuWithImageAndTime extends ElectronMenu {
  image?: string;
  timestamp?: string;
}

let textMenu: ElectronMenu;

let copyContext = '';

const defaultMenu = Menu.buildFromTemplate([
  {
    click: () => clipboard.writeText(copyContext),
    label: locale.getText('menuCopy'),
  },
]);

const textMenuTemplate: MenuItemConstructorOptions[] = [
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
    role: 'selectAll',
  },
];

const createTextMenu = (dictionarySuggestions: string[], misspelledWord?: string) => {
  const template = textMenuTemplate.slice();

  if (dictionarySuggestions.length > 0) {
    template.push({
      type: 'separator',
    });

    for (const suggestion of dictionarySuggestions) {
      template.push({
        click: () => remote.getCurrentWindow().webContents.replaceMisspelling(suggestion),
        label: suggestion,
      });
    }

    if (misspelledWord) {
      template.push({
        click: () => remote.getCurrentWindow().webContents.session.addWordToSpellCheckerDictionary(misspelledWord),
        label: 'Add to dictionary',
      });
    }
  }

  textMenu = Menu.buildFromTemplate(template);
};

const imageMenu: ElectronMenuWithImageAndTime = Menu.buildFromTemplate([
  {
    click: () => savePicture(imageMenu.image || '', imageMenu.timestamp),
    label: locale.getText('menuSavePictureAs'),
  },
]);

remote.getCurrentWebContents().on('context-menu', (_event, params) => {
  copyContext = '';

  if (params.isEditable) {
    createTextMenu(params.dictionarySuggestions, params.misspelledWord);
    textMenu.popup({window: remote.getCurrentWindow()});
  } else if (params.mediaType === 'image') {
    imageMenu.image = params.srcURL;
    imageMenu.popup({window: remote.getCurrentWindow()});
  } else if (!!params.linkURL) {
    copyContext = params.linkURL.replace(/^mailto:/, '');
    defaultMenu.popup({window: remote.getCurrentWindow()});
  } else if (!!params.selectionText) {
    copyContext = params.selectionText;
    defaultMenu.popup({window: remote.getCurrentWindow()});
  } else if (params.editFlags.canCopy) {
    copyContext = params.selectionText;
    defaultMenu.popup({window: remote.getCurrentWindow()});
  }
});

const savePicture = async (url: RequestInfo, timestamp?: string) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  return ipcRenderer.send(EVENT_TYPE.ACTION.SAVE_PICTURE, new Uint8Array(arrayBuffer), timestamp);
};
