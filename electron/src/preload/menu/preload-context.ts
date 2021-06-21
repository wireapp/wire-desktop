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

// eslint-disable-next-line id-length
ipcRenderer.on(EVENT_TYPE.IPC.CONTEXT_INNER_TEXT, (_event, {x, y}: {x: number; y: number}) => {
  let element = document.elementFromPoint(x, y) as HTMLElement;

  // Maybe we are in a code block _inside_ an element with the 'text' class?
  // Code block can consist of many tags: CODE, PRE, SPAN, etc.
  while (element && (element as any) !== document && !(element as HTMLElement).classList.contains('text')) {
    element = element.parentNode as HTMLElement;
  }

  const innerText = ((element as HTMLElement).innerText || '').trim();

  ipcRenderer.emit(EVENT_TYPE.IPC.CONTEXT_INNER_TEXT_RESPONSE, {hasElement: !!element, innerText});
});
