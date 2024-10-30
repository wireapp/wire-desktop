/*
 * Wire
 * Copyright (C) 2024 Wire Swiss GmbH
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

import {getNewWindowOptions} from '../window/WindowUtil';

const PICTURE_IN_PICTURE_CALL_FRAME_NAME = 'WIRE_PICTURE_IN_PICTURE_CALL';

export const isPictureInPictureCallWindow = (frameName: string): boolean => {
  return frameName === PICTURE_IN_PICTURE_CALL_FRAME_NAME;
};

export const getPictureInPictureCallWindowOptions = (): Electron.BrowserWindowConstructorOptions => {
  return getNewWindowOptions({
    autoHideMenuBar: true,
    width: 1026,
    height: 829,
    resizable: true,
    fullscreenable: true,
    maximizable: true,
    alwaysOnTop: false,
    minimizable: true,
  });
};
