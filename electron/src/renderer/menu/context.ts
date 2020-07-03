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

import {
  clipboard,
  ipcRenderer,
  Menu as ElectronMenu,
  remote,
  ContextMenuParams,
  MenuItemConstructorOptions,
  webContents,
} from 'electron';

import {EVENT_TYPE} from '../../lib/eventType';
import * as locale from '../../locale/locale';
import {config} from '../../settings/config';

const Menu = remote.Menu;

interface ElectronMenuWithImageAndTime extends ElectronMenu {
  image?: string;
  timestamp?: string;
}

const savePicture = async (url: RequestInfo, timestamp?: string): Promise<void> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  ipcRenderer.send(EVENT_TYPE.ACTION.SAVE_PICTURE, new Uint8Array(arrayBuffer), timestamp);
};

const createDefaultMenu = (copyContext: string) =>
  Menu.buildFromTemplate([
    {
      click: () => clipboard.writeText(copyContext),
      label: locale.getText('menuCopy'),
    },
  ]);

const createTextMenu = (params: ContextMenuParams) => {
  const template: MenuItemConstructorOptions[] = [
    {
      enabled: params.editFlags.canCut,
      label: locale.getText('menuCut'),
      role: 'cut',
    },
    {
      enabled: params.editFlags.canCopy,
      label: locale.getText('menuCopy'),
      role: 'copy',
    },
    {
      enabled: params.editFlags.canPaste,
      label: locale.getText('menuPaste'),
      role: 'paste',
    },
    {
      type: 'separator',
    },
    {
      enabled: params.editFlags.canSelectAll,
      label: locale.getText('menuSelectAll'),
      role: 'selectAll',
    },
  ];

  if (params.dictionarySuggestions.length > 0) {
    template.push({
      type: 'separator',
    });

    for (const suggestion of params.dictionarySuggestions) {
      template.push({
        click: () => remote.getCurrentWindow().webContents.replaceMisspelling(suggestion),
        label: suggestion,
      });
    }

    if (params.misspelledWord) {
      template.push({
        click: () =>
          remote.getCurrentWindow().webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
        label: 'Add to dictionary',
      });
    }
  }

  return Menu.buildFromTemplate(template);
};

const imageMenu: ElectronMenuWithImageAndTime = Menu.buildFromTemplate([
  {
    click: () => savePicture(imageMenu.image || '', imageMenu.timestamp),
    label: locale.getText('menuSavePictureAs'),
  },
]);

remote.getCurrentWebContents().on('context-menu', (_event, params) => {
  const window = remote.getCurrentWindow();

  if (params.isEditable) {
    const textMenu = createTextMenu(params);
    textMenu.popup({window});
  } else if (params.mediaType === 'image') {
    imageMenu.image = params.srcURL;
    imageMenu.popup({window});
  } else if (!!params.linkURL) {
    const copyContext = params.linkURL.replace(/^mailto:/, '');
    createDefaultMenu(copyContext).popup({window});
  } else if (!!params.selectionText || params.editFlags.canCopy) {
    const copyContext = params.selectionText;
    createDefaultMenu(copyContext).popup({window});
  } else if (params.editFlags.canSelectAll) {
    let element: HTMLElement = document.elementFromPoint(params.x, params.y) as HTMLElement;

    // Maybe we are in a code block _inside_ an element with the 'text' class?
    // Code block can consist of many tags: CODE, PRE, SPAN, etc.
    while (element && (element as any) !== document && !(element as HTMLElement).classList.contains('text')) {
      element = element.parentNode as HTMLElement;
    }

    if (element) {
      const copyContext = (params.selectionText || '').toString() || ((element as HTMLElement).innerText || '').trim();
      if (copyContext) {
        createDefaultMenu(copyContext).popup({window});
      }
    }
  }
});
