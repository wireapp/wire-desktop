/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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
  Menu as ElectronMenu,
  ContextMenuParams,
  MenuItemConstructorOptions,
  WebContents,
  nativeImage,
  ipcMain,
  ipcRenderer,
} from 'electron';
import {EVENT_TYPE} from '../lib/eventType';
import {config} from '../settings/config';
import * as locale from '../locale/locale';
import {WindowManager} from '../window/WindowManager';

interface ElectronMenuWithImageAndTime extends ElectronMenu {
  image?: string;
  timestamp?: string;
}

const createDefaultMenu = (copyContext: string) =>
  ElectronMenu.buildFromTemplate([
    {
      click: () => clipboard.writeText(copyContext),
      label: locale.getText('menuCopy'),
    },
  ]);

const savePicture = async (url: RequestInfo, timestamp?: string): Promise<void> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
    },
  });
  const bytes = await response.arrayBuffer();
  ipcRenderer.send(EVENT_TYPE.ACTION.SAVE_PICTURE, new Uint8Array(bytes), timestamp);
};

const copyPicture = async (url: RequestInfo): Promise<void> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
    },
  });
  const bytes = await response.arrayBuffer();
  const image = nativeImage.createFromBuffer(Buffer.from(bytes));
  clipboard.writeImage(image);
};

const createTextMenu = (params: ContextMenuParams, webContents: WebContents): ElectronMenu => {
  const {editFlags, dictionarySuggestions} = params;

  const template: MenuItemConstructorOptions[] = [
    {
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.EDIT.CUT),
      enabled: editFlags.canCut,
      label: locale.getText('menuCut'),
    },
    {
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.EDIT.COPY),
      enabled: editFlags.canCopy,
      label: locale.getText('menuCopy'),
    },
    {
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.EDIT.PASTE),
      enabled: editFlags.canPaste,
      label: locale.getText('menuPaste'),
    },
    {
      type: 'separator',
    },
    {
      click: (_menuItem, browserWindow) => browserWindow?.webContents.send(EVENT_TYPE.EDIT.SELECT_ALL),
      enabled: editFlags.canSelectAll,
      label: locale.getText('menuSelectAll'),
    },
  ];

  if (dictionarySuggestions.length > 0) {
    template.push({
      type: 'separator',
    });

    for (const suggestion of dictionarySuggestions) {
      template.push({
        click: () => webContents.replaceMisspelling(suggestion),
        label: suggestion,
      });
    }
  }

  return ElectronMenu.buildFromTemplate(template);
};

const imageMenu: ElectronMenuWithImageAndTime = ElectronMenu.buildFromTemplate([
  {
    click: () => savePicture(imageMenu.image || ''),
    label: locale.getText('menuSavePictureAs'),
  },
  {
    click: () => copyPicture(imageMenu.image || ''),
    label: locale.getText('menuCopyPicture'),
  },
]);

export const openContextMenu = async (
  _event: Event,
  params: ContextMenuParams,
  webContents: WebContents,
): Promise<void> => {
  const window = WindowManager.getPrimaryWindow();

  if (params.isEditable) {
    const textMenu = createTextMenu(params, webContents);
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
    const getInnerText = (): Promise<{hasElement: boolean; innerText: string}> => {
      return new Promise(resolve => {
        ipcMain.on(
          EVENT_TYPE.IPC.CONTEXT_INNER_TEXT_RESPONSE,
          (_event, innerText: {hasElement: boolean; innerText: string}) => {
            resolve(innerText);
          },
        );
        ipcMain.emit(EVENT_TYPE.IPC.CONTEXT_INNER_TEXT);
      });
    };

    const element = await getInnerText();

    if (element.hasElement) {
      const copyContext = (params.selectionText || '').toString() || element.innerText;
      if (copyContext) {
        createDefaultMenu(copyContext).popup({window});
      }
    }
  }
};
