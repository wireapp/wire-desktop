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

import { colorFromId } from '../lib/accentColor';
import { connect } from 'react-redux';
import { getText } from '../lib/locale';
import { preventFocus } from '../lib/util';
import ContextMenu from './context/ContextMenu';
import ContextMenuItem from './context/ContextMenuItem';
import ContextMenuTrigger from './context/ContextMenuTrigger';
import PersonalIcon from './PersonalIcon';
import React from 'react';
import TeamIcon from './TeamIcon';
import {
  toggleAccountContextVisibility,
  setAccountContextHidden,
  addAccountWithSession,
  switchAccount,
} from '../actions/';

import './Sidebar.css';

function className(account) {
  return [
    'Sidebar-icon',
    account.badgeCount > 0 ? 'Sidebar-icon-badge' : '',
  ].join(' ');
}

const switchToNewAccount = (changeAccount, account) => {
  if (!account.visible) {
    changeAccount(account.id);
  }
};

const Sidebar = ({
  accounts,
  currentAccentID,
  hasCreatedAccount,
  hasReachedLimitOfAccounts,
  isAddingAccount,
  isContextMenuVisible,
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
          onClick={() => switchToNewAccount(connected.switchAccount, account)}
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
        <ContextMenuTrigger
          id="account"
          onClick={preventFocus(event => {
            const cRect = event.target.getBoundingClientRect();
            connected.toggleAccountContextVisibility(
              cRect.left + cRect.width / 2,
              cRect.top + cRect.height / 2
            );
          })}
          forceVisible={isContextMenuVisible}
        />
      )}

    <ContextMenu id="account">
      <ContextMenuItem
        onClick={() =>
          window.open(
            'https://wire.com/create-team/?pk_campaign=client&pk_kwd=desktop'
          )}
      >
        {getText('wrapperCreateTeam')}
      </ContextMenuItem>
      <ContextMenuItem onClick={connected.addAccountWithSession}>
        {getText('wrapperAddAccount')}
      </ContextMenuItem>
    </ContextMenu>
  </div>
);

export default connect(
  ({ accounts, contextMenuState }) => ({
    accounts,
    currentAccentID: (accounts.find(account => account.visible) || {}).accentID,
    hasCreatedAccount: accounts.some(account => account.userID !== undefined),
    hasReachedLimitOfAccounts: accounts.length === 3,
    isAddingAccount:
      accounts.length && accounts.some(account => account.userID === undefined),
    isContextMenuVisible: contextMenuState.isAccountContextMenuVisible,
  }),
  {
    addAccountWithSession,
    setAccountContextHidden,
    switchAccount,
    toggleAccountContextVisibility,
  }
)(Sidebar);
