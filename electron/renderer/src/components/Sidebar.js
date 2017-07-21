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

import TeamIcon from './TeamIcon';
import PersonalIcon from './PersonalIcon';
import { ContextMenu, ContextMenuItem, ContextMenuTrigger } from './ContextMenu';
import { colorFromId } from '../lib/accentColor';

import './Sidebar.css';

function className(account) {
  return [
    'Sidebar-icon',
    (account.badgeCount > 0 ? 'Sidebar-icon-badge' : ''),
  ].join(' ');
}

const switchToNewAccount = (switchAccount, account) => {
  if (!account.visible) {
    switchAccount(account.id);
  }
};

const preventFocus = event => {
  event.stopPropagation();
  event.preventDefault();
};

const Sidebar = ({
  accounts,
  addAccountWithSession,
  currentAccentID,
  hasCreatedAccount,
  hasReachedLimitOfAccounts,
  isAddingAccount,
  switchAccount,
}) =>
  <div className="Sidebar" style={hasCreatedAccount ? {} : { display: 'none'}} onMouseDown={preventFocus}>
    {accounts.map(account => (
      <div className="Sidebar-cell" key={account.id}>
        <div style={{ color: colorFromId(currentAccentID) }} className={className(account)}>
          {account.teamID ? (
            <TeamIcon account={account} accentID={currentAccentID} onClick={() => switchToNewAccount(switchAccount, account)} onMouseDown={preventFocus}/>
          ) : (
            <PersonalIcon account={account} accentID={currentAccentID} onClick={() => switchToNewAccount(switchAccount, account)} onMouseDown={preventFocus}/>
          )}
        </div>
      </div>
    ))}
    {!isAddingAccount && !hasReachedLimitOfAccounts &&
      <ContextMenuTrigger id="account">
        <div className="Sidebar-cell">
          <div data-uie-name="do-open-plus-menu" className="Sidebar-account-add">
            <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 5.25v1.5h5.25V12h1.5V6.75H12v-1.5H6.75V0h-1.5v5.25" fillRule="evenodd"/>
            </svg>
          </div>
        </div>
      </ContextMenuTrigger>
    }

    <ContextMenu id="account">
      <ContextMenuItem onClick={() => window.open('https://teams.wire.com')}>Create Team</ContextMenuItem>
      <ContextMenuItem onClick={() => addAccountWithSession()}>Add Account</ContextMenuItem>
    </ContextMenu>
  </div>;

export default Sidebar;
