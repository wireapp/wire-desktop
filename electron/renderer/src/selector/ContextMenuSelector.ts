/*
 * Wire
 * Copyright (C) 2023 Wire Swiss GmbH
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

import {State} from '../index';

export class ContextMenuSelector {
  static getContextMenuState = (state: State) => state.contextMenuState;
  static isEditAccountMenuVisible = (state: State) =>
    ContextMenuSelector.getContextMenuState(state).isEditAccountMenuVisible;
  static getPosition = (state: State) => ContextMenuSelector.getContextMenuState(state).position;
  static getAccountId = (state: State) => ContextMenuSelector.getContextMenuState(state).accountId;
  static getIsAtLeastAdmin = (state: State) => ContextMenuSelector.getContextMenuState(state).isAtLeastAdmin;
  static getLifecycle = (state: State) => ContextMenuSelector.getContextMenuState(state).lifecycle;
  static getSessionId = (state: State) => ContextMenuSelector.getContextMenuState(state).sessionID;
  static shouldAutoFocus = (state: State) => ContextMenuSelector.getContextMenuState(state).shouldAutoFocus;
}
