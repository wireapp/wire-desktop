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

import './TeamIcon.css';
import PropTypes from 'prop-types';
import React from 'react';
import {colorFromId} from '../lib/accentColor';

const TeamIcon = ({account, accentID}) => {
  return (
    <div className="TeamIcon" title={account.name} data-uie-name="item-team" data-uie-value={account.name}>
      {account.visible && <div className="TeamIcon-border" style={{borderColor: colorFromId(accentID)}} />}
      <div className="TeamIcon-inner">
        {account.picture ? <img src={account.picture} /> : <span>{[...account.name][0]}</span>}
      </div>
    </div>
  );
};

TeamIcon.propTypes = {
  accentID: PropTypes.number,
  account: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

export default TeamIcon;
