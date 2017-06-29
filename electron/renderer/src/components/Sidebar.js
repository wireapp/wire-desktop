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

import TeamIcon from './TeamIcon'
import PersonalIcon from './PersonalIcon'
import { colorFromId } from '../lib/accentColor'

import './Sidebar.css'

function className(account) {
  return [
    'Sidebar-icon',
    ((account.badgeCount > 0 && account.visible === false) ? 'Sidebar-icon-badge' : '')
  ].join(' ')
}

function hasCreatedAccount(accounts) {
  return accounts.length && accounts.some((account) => account.userID !== undefined)
}

function isCreatingAccount(accounts) {
  return accounts.length && accounts.some((account) => account.userID === undefined)
}

const Sidebar = ({ accounts, addAccountWithSession, switchAccount }) =>
  <div className="Sidebar" style={hasCreatedAccount(accounts) ? {} : { display: 'none'}}>
    {accounts.map(account => (
      <div style={{ color: colorFromId(account.accentID) }} className={className(account)} key={account.id}>
        {!account.teamID ? (
          <TeamIcon account={account} onClick={() => switchAccount(account.id)} />
        ) : (
          <PersonalIcon account={account} onClick={() => switchAccount(account.id)} />
        )}
      </div>
    ))}
    {!isCreatingAccount(accounts) &&
      <div className="Sidebar-account-add" onClick={addAccountWithSession} >
        <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 6.125v1.75h6.125V14h1.75V7.875H14v-1.75H7.875V0h-1.75v6.125" fillRule="evenodd"/>
        </svg>
      </div>
    }
  </div>

export default Sidebar
