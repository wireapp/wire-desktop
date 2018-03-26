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

import React from 'react';

const AddAccountMenuTrigger = ({ onClick, forceVisible }) => (
  <div
    className={`Sidebar-cell${forceVisible ? '' : ' ContextMenuTrigger'}`}
    onClick={onClick}
    onContextMenu={onClick}
    data-uie-name="do-open-plus-menu"
  >
    <div className="Sidebar-account-add">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path
          d="M0 5.25v1.5h5.25V12h1.5V6.75H12v-1.5H6.75V0h-1.5v5.25"
          fillRule="evenodd"
        />
      </svg>
    </div>
  </div>
);

export default AddAccountMenuTrigger;
