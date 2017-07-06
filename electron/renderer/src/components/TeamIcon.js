/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

import { colorFromId } from '../lib/accentColor';

import './TeamIcon.css';

const TeamIcon = ({ account, onClick }) =>
  <div className="TeamIcon" onClick={onClick} data-uie-name="item-team" data-uie-value={account.name}>
    {account.visible &&
      <svg style={{fill: colorFromId(account.accentID)}} width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.706 1.82l9.52 5.375C34.444 8.445 36 11.112 36 13.655v10.69c0 2.546-1.553 5.207-3.773 6.46l-9.52 5.375c-2.183 1.233-5.228 1.234-7.413 0l-9.52-5.375C3.556 29.555 2 26.888 2 24.345v-10.69c0-2.546 1.553-5.207 3.773-6.46l9.52-5.375c2.183-1.233 5.228-1.234 7.413 0zm-6.43 1.74l-9.52 5.376C5.164 9.836 4 11.83 4 13.656v10.69c0 1.82 1.168 3.82 2.756 4.718l9.52 5.375c1.575.888 3.875.887 5.447 0l9.52-5.376c1.593-.9 2.757-2.894 2.757-4.72v-10.69c0-1.82-1.168-3.82-2.756-4.718l-9.52-5.375c-1.575-.888-3.875-.887-5.447 0z" fillRule="nonzero"></path>
      </svg>
    }
    <svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.26 5.303c.96-.543 2.514-.545 3.48 0l9.52 5.375c.96.542 1.74 1.878 1.74 2.977v10.69c0 1.102-.774 2.432-1.74 2.977l-9.52 5.375c-.96.543-2.514.545-3.48 0l-9.52-5.375C6.78 26.78 6 25.444 6 24.345v-10.69c0-1.102.774-2.432 1.74-2.977l9.52-5.375z" fillRule="evenodd"></path>
    </svg>
    <span>{ [...account.name][0] }</span>
  </div>;

export default TeamIcon;
