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

import {AccentColor} from '@wireapp/commons';
import * as React from 'react';
import {Account} from '../../interfaces/';

import './PersonalIcon.css';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  accentID?: number;
  account: Account;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const PersonalIcon: React.SFC<Props> = ({account, accentID, onClick}) => (
  <div
    className="PersonalIcon"
    title={account.name}
    onClick={onClick}
    data-uie-name="item-team"
    data-uie-value={account.name}
  >
    {account.visible && (
      <div className="PersonalIcon-border" style={{borderColor: AccentColor.getById(accentID).color}} />
    )}
    <div className="PersonalIcon-inner">{account.picture && <img src={account.picture} />}</div>
  </div>
);

export default PersonalIcon;
