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

import React from 'react'

import { colorFromId } from '../lib/accentColor'

import './PersonalIcon.css'

const PersonalIcon = ({ account, onClick }) => {
  const display = account.visible ? {} : { display: 'none' }
  const borderColor = {borderColor: colorFromId(account.accentID).color}
  return (
    <div className="PersonalIcon" onClick={onClick} data-uie-name="item-team" data-uie-value={account.name}>
      <div className="PersonalIcon-border" style={{...display, ...borderColor}}></div>
      <div className="PersonalIcon-inner"></div>
    </div>
  )
}


export default PersonalIcon
