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
  WebContents,
  nativeImage,
} from 'electron';

import {EVENT_TYPE} from '../../lib/eventType';

const Menu = remote.Menu;

interface ElectronMenuWithImageAndTime extends ElectronMenu {
  image?: string;
  timestamp?: string;
}

const savePicture = async (url: RequestInfo, timestamp?: string): Promise<void> => {
  const userAgent = await ipcRenderer.invoke('CONFIG_GET_USER_AGENT');
  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
    },
  });
  const bytes = await response.arrayBuffer();
  ipcRenderer.send(EVENT_TYPE.ACTION.SAVE_PICTURE, new Uint8Array(bytes), timestamp);
};

const copyPicture = async (url: RequestInfo): Promise<void> => {
  const userAgent = await ipcRenderer.invoke('CONFIG_GET_USER_AGENT');
  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
    },
  });
  const bytes = await response.arrayBuffer();
  const image = nativeImage.createFromBuffer(Buffer.from(bytes));
  clipboard.writeImage(image);
};

const createDefaultMenu = async (copyContext: string): Promise<ElectronMenu> => {
  return Menu.buildFromTemplate([
    {
      click: () => clipboard.writeText(copyContext),
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuCopy'),
    },
  ]);
};

const createTextMenu = async (params: ContextMenuParams, webContents: WebContents): Promise<ElectronMenu> => {
  const {editFlags, dictionarySuggestions} = params;

  const template: MenuItemConstructorOptions[] = [
    {
      enabled: editFlags.canCut,
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuCut'),
      role: 'cut',
    },
    {
      enabled: editFlags.canCopy,
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuCopy'),
      role: 'copy',
    },
    {
      enabled: editFlags.canPaste,
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuPaste'),
      role: 'paste',
    },
    {
      type: 'separator',
    },
    {
      enabled: editFlags.canSelectAll,
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuSelectAll'),
      role: 'selectAll',
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

  return Menu.buildFromTemplate(template);
};

async function buildImageMenu(image: string): Promise<ElectronMenuWithImageAndTime> {
  return Menu.buildFromTemplate([
    {
      click: () => savePicture(image || ''),
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuSavePictureAs'),
    },
    {
      click: () => copyPicture(image || ''),
      label: await ipcRenderer.invoke('LOCALE_GET_TEXT', 'menuCopyPicture'),
    },
  ]);
}

const webContents = remote.getCurrentWebContents();

webContents.on('context-menu', async (_event, params) => {
  const window = remote.getCurrentWindow();

  if (params.isEditable) {
    const textMenu = await createTextMenu(params, webContents);
    textMenu.popup({window});
  } else if (params.mediaType === 'image') {
    const imageMenu = await buildImageMenu(params.srcURL);
    imageMenu.popup({window});
  } else if (!!params.linkURL) {
    const copyContext = params.linkURL.replace(/^mailto:/, '');
    const defaultMenu = await createDefaultMenu(copyContext);
    defaultMenu.popup({window});
  } else if (!!params.selectionText || params.editFlags.canCopy) {
    const copyContext = params.selectionText;
    const defaultMenu = await createDefaultMenu(copyContext);
    defaultMenu.popup({window});
  } else if (params.editFlags.canSelectAll) {
    let element = document.elementFromPoint(params.x, params.y) as HTMLElement;

    // Maybe we are in a code block _inside_ an element with the 'text' class?
    // Code block can consist of many tags: CODE, PRE, SPAN, etc.
    while (element && (element as any) !== document && !(element as HTMLElement).classList.contains('text')) {
      element = element.parentNode as HTMLElement;
    }

    if (element) {
      const copyContext = (params.selectionText || '').toString() || ((element as HTMLElement).innerText || '').trim();
      if (copyContext) {
        const defaultMenu = await createDefaultMenu(copyContext);
        defaultMenu.popup({window});
      }
    }
  }
});
