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

import './AccountIcon.css';
import PropTypes from 'prop-types';
import React from 'react';
import {colorFromId} from '../lib/accentColor';

const AccountIcon = ({account, ...props}) => {
  const accountType = () => {
    if (!account.name) {
      return 'new';
    }

    return account.teamID ? 'team' : 'personal';
  };

  return (
    <div
      className={`AccountIcon AccountIcon-${accountType()}`}
      title={account.name}
      data-uie-name="item-team"
      data-uie-value={account.name}
      {...props}
    >
      {account.visible && <div className="AccountIcon-border" style={{borderColor: colorFromId(account.accentID)}} />}
      <div className="AccountIcon-inner">
        {account.picture ? <img src={account.picture} /> : <div>{account.name && [...account.name][0]}</div>}
      </div>
    </div>
  );
};

AccountIcon.propTypes = {
  account: PropTypes.object.isRequired,
};

export default AccountIcon;
