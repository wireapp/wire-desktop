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

import {ipcRenderer} from 'electron';

import {EVENT_TYPE} from '../../lib/eventType';
import * as locale from '../../locale';

interface ContextMenuParams {
  x: number;
  y: number;
  linkURL?: string;
  srcURL?: string;
  mediaType?: string;
  isEditable?: boolean;
  selectionText?: string;
  editFlags?: {
    canCut?: boolean;
    canCopy?: boolean;
    canPaste?: boolean;
    canSelectAll?: boolean;
  };
  dictionarySuggestions?: string[];
}

interface MenuItemTemplate {
  label?: string;
  enabled?: boolean;
  type?: 'normal' | 'separator';
  click?: () => void;
}

/**
 * Secure context menu implementation using IPC communication.
 * This replaces the previous @electron/remote implementation with secure contextBridge APIs.
 */

const createTextMenu = (params: ContextMenuParams): MenuItemTemplate[] => {
  const {editFlags = {}, dictionarySuggestions = []} = params;

  const template: MenuItemTemplate[] = [
    {
      label: locale.getText('menuCut'),
      enabled: editFlags.canCut,
      click: () => document.execCommand('cut'),
    },
    {
      label: locale.getText('menuCopy'),
      enabled: editFlags.canCopy,
      click: () => document.execCommand('copy'),
    },
    {
      label: locale.getText('menuPaste'),
      enabled: editFlags.canPaste,
      click: () => document.execCommand('paste'),
    },
    {
      type: 'separator',
    },
    {
      label: locale.getText('menuSelectAll'),
      enabled: editFlags.canSelectAll,
      click: () => document.execCommand('selectAll'),
    },
  ];

  if (dictionarySuggestions.length > 0) {
    template.push({
      type: 'separator',
    });

    for (const suggestion of dictionarySuggestions) {
      template.push({
        label: suggestion,
        click: () => ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.REPLACE_MISSPELLING, suggestion),
      });
    }
  }

  return template;
};

const createImageMenu = (imageUrl: string): MenuItemTemplate[] => {
  return [
    {
      label: locale.getText('menuSavePictureAs'),
      click: () => ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.SAVE_IMAGE, imageUrl),
    },
    {
      label: locale.getText('menuCopyPicture'),
      click: () => ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.COPY_IMAGE, imageUrl),
    },
  ];
};

const createDefaultMenu = (copyText: string): MenuItemTemplate[] => {
  return [
    {
      label: locale.getText('menuCopy'),
      click: () => ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.COPY_TEXT, copyText),
    },
  ];
};

const showContextMenu = (template: MenuItemTemplate[], x: number, y: number) => {
  const existingMenu = document.getElementById('wire-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement('div');
  menu.id = 'wire-context-menu';
  menu.style.cssText = `
    position: fixed;
    top: ${y}px;
    left: ${x}px;
    background: var(--background-color, #fff);
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 10000;
    min-width: 150px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
  `;

  template.forEach(item => {
    if (item.type === 'separator') {
      const separator = document.createElement('div');
      separator.style.cssText = `
        height: 1px;
        background: var(--border-color, #eee);
        margin: 4px 0;
      `;
      menu.appendChild(separator);
    } else {
      const menuItem = document.createElement('div');
      menuItem.textContent = item.label || '';
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: ${item.enabled !== false ? 'pointer' : 'default'};
        color: ${item.enabled !== false ? 'var(--text-color, #000)' : 'var(--disabled-color, #999)'};
        &:hover {
          background: ${item.enabled !== false ? 'var(--hover-color, #f0f0f0)' : 'transparent'};
        }
      `;

      if (item.enabled !== false && item.click) {
        menuItem.addEventListener('click', () => {
          item.click!();
          menu.remove();
        });

        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = 'var(--hover-color, #f0f0f0)';
        });

        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent';
        });
      }

      menu.appendChild(menuItem);
    }
  });

  document.body.appendChild(menu);

  const closeMenu = (event: MouseEvent) => {
    if (!menu.contains(event.target as Node)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
};

document.addEventListener('contextmenu', event => {
  event.preventDefault();

  const target = event.target as HTMLElement;
  const params: ContextMenuParams = {
    x: event.clientX,
    y: event.clientY,
    isEditable: target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA',
    selectionText: window.getSelection()?.toString() || '',
  };

  if (target.tagName === 'IMG') {
    const img = target as HTMLImageElement;
    params.mediaType = 'image';
    params.srcURL = img.src;
    const template = createImageMenu(img.src);
    showContextMenu(template, params.x, params.y);
    return;
  }

  const link = target.closest('a');
  if (link && link.href) {
    params.linkURL = link.href;
    const copyText = link.href.replace(/^mailto:/, '');
    const template = createDefaultMenu(copyText);
    showContextMenu(template, params.x, params.y);
    return;
  }

  if (params.selectionText) {
    const template = createDefaultMenu(params.selectionText);
    showContextMenu(template, params.x, params.y);
    return;
  }

  if (params.isEditable) {
    params.editFlags = {
      canCut: document.queryCommandEnabled('cut'),
      canCopy: document.queryCommandEnabled('copy'),
      canPaste: document.queryCommandEnabled('paste'),
      canSelectAll: document.queryCommandEnabled('selectAll'),
    };
    const template = createTextMenu(params);
    showContextMenu(template, params.x, params.y);
    return;
  }

  let element = target;
  while (element && element !== document.body && !element.classList.contains('text')) {
    element = element.parentElement!;
  }

  if (element && element.classList.contains('text')) {
    const textContent = element.innerText?.trim();
    if (textContent) {
      const template = createDefaultMenu(textContent);
      showContextMenu(template, params.x, params.y);
    }
  }
});

export {};
