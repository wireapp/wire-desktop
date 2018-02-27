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

import { colorFromId } from '../lib/accentColor';
import { connect } from 'react-redux';
import { preventFocus } from '../lib/util';
import AddAccountMenuTrigger from './context/AddAccountMenuTrigger';
import AddAccountMenu from './context/AddAccountMenu';
import EditAccountMenu from './context/EditAccountMenu';
import PersonalIcon from './PersonalIcon';
import React from 'react';
import TeamIcon from './TeamIcon';
import {
  setAccountContextHidden,
  switchAccount,
  toggleAddAccountMenuVisibility,
  toggleEditAccountMenuVisibility,
} from '../actions/';

import './Sidebar.css';

function className(account) {
  return [
    'Sidebar-icon',
    account.badgeCount > 0 ? 'Sidebar-icon-badge' : '',
  ].join(' ');
}

const centerOfEventTarget = event => {
  const cRect = event.target.getBoundingClientRect();
  return [cRect.left + cRect.width / 2, cRect.top + cRect.height / 2];
};

const Sidebar = ({
  accounts,
  currentAccentID,
  hasCreatedAccount,
  hasReachedLimitOfAccounts,
  isAddingAccount,
  isAddAccountMenuVisible,
  isEditAccountMenuVisible,
  ...connected
}) => (
  <div
    className="Sidebar"
    style={hasCreatedAccount ? {} : { display: 'none' }}
    onMouseDown={preventFocus()}
    onClick={connected.setAccountContextHidden}
  >
    {accounts.map(account => (
      <div className="Sidebar-cell" key={account.id}>
        <div
          style={{ color: colorFromId(currentAccentID) }}
          className={className(account)}
          onClick={() => connected.switchAccount(account.id)}
          onContextMenu={preventFocus(event => {
            const isAtLeastAdmin = [
              'z.team.TeamRole.ROLE.OWNER',
              'z.team.TeamRole.ROLE.ADMIN',
            ].includes(account.teamRole);
            connected.toggleEditAccountMenuVisibility(
              ...centerOfEventTarget(event),
              account.id,
              account.sessionID,
              account.lifecycle,
              isAtLeastAdmin
            );
          })}
          onMouseDown={preventFocus()}
        >
          {account.teamID ? (
            <TeamIcon account={account} accentID={currentAccentID} />
          ) : (
            <PersonalIcon account={account} accentID={currentAccentID} />
          )}
        </div>
      </div>
    ))}
    {!isAddingAccount &&
      !hasReachedLimitOfAccounts && (
        <AddAccountMenuTrigger
          id="account"
          onClick={preventFocus(event => {
            connected.toggleAddAccountMenuVisibility(
              ...centerOfEventTarget(event)
            );
          })}
          forceVisible={isAddAccountMenuVisible}
        />
      )}

    {isAddAccountMenuVisible && <AddAccountMenu />}
    {isEditAccountMenuVisible && <EditAccountMenu />}
  </div>
);

export default connect(
  ({ accounts, contextMenuState }) => ({
    accounts,
    currentAccentID: (accounts.find(account => account.visible) || {}).accentID,
    hasCreatedAccount: accounts.some(account => account.userID !== undefined),
    hasReachedLimitOfAccounts: accounts.length >= 3,
    isAddAccountMenuVisible: contextMenuState.isAddAccountMenuVisible,
    isAddingAccount:
      accounts.length && accounts.some(account => account.userID === undefined),
    isEditAccountMenuVisible: contextMenuState.isEditAccountMenuVisible,
  }),
  {
    setAccountContextHidden,
    switchAccount,
    toggleAddAccountMenuVisibility,
    toggleEditAccountMenuVisibility,
  }
)(Sidebar);
