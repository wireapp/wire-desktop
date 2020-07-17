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
import {connect} from 'react-redux';

import {EVENT_TYPE} from '../../../dist/lib/eventType';
import {addAccountWithSession, setAccountContextHidden, toggleEditAccountMenuVisibility} from '../actions';
import {colorFromId} from '../lib/accentColor';
import {preventFocus} from '../lib/util';
import AccountIcon from './AccountIcon';
import AddAccountTrigger from './context/AddAccountTrigger';
import EditAccountMenu from './context/EditAccountMenu';
import {AccountSelector} from '../selector/AccountSelector';
import {ContextMenuSelector} from '../selector/ContextMenuSelector';

import './Sidebar.css';

const centerOfEventTarget = event => {
  const clientRectangle = event.currentTarget.getBoundingClientRect();
  const centerX = clientRectangle.left + clientRectangle.width / 2;
  const centerY = clientRectangle.top + clientRectangle.height / 2;
  return {centerX, centerY};
};

const getClassName = account => {
  const showIconBadge = account.badgeCount > 0 ? ' Sidebar-icon-badge' : '';
  const showIconCursor = account.visible ? '' : ' Sidebar-icon-cursor';
  return `Sidebar-icon${showIconBadge}${showIconCursor}`;
};

const Sidebar = ({
  accounts,
  currentAccentID,
  hasCreatedAccount,
  hasReachedLimitOfAccounts,
  isAddingAccount,
  isEditAccountMenuVisible,
  ...connected
}) => (
  <div
    className="Sidebar"
    style={hasCreatedAccount ? {} : {display: 'none'}}
    onMouseDown={preventFocus()}
    onClick={connected.setAccountContextHidden}
  >
    {accounts.map(account => (
      <div className="Sidebar-cell" key={account.id}>
        <div
          style={{color: colorFromId(currentAccentID)}}
          className={getClassName(account)}
          onClick={preventFocus(() =>
            window.dispatchEvent(
              new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex: accounts.indexOf(account)}}),
            ),
          )}
          onContextMenu={preventFocus(event => {
            const isAtLeastAdmin =
              account.teamRole === 'z.team.TeamRole.ROLE.OWNER' || account.teamRole === 'z.team.TeamRole.ROLE.ADMIN';
            const {centerX, centerY} = centerOfEventTarget(event);
            connected.toggleEditAccountMenuVisibility(
              centerX,
              centerY,
              account.id,
              account.sessionID,
              account.lifecycle,
              isAtLeastAdmin,
            );
          })}
          onMouseDown={preventFocus()}
        >
          <AccountIcon account={account} />
        </div>
      </div>
    ))}
    {!isAddingAccount && !hasReachedLimitOfAccounts && (
      <AddAccountTrigger id="account" onClick={connected.addAccountWithSession} />
    )}

    {isEditAccountMenuVisible && <EditAccountMenu />}
  </div>
);

export default connect(
  state => ({
    accounts: AccountSelector.getAccounts(state),
    currentAccentID: AccountSelector.getSelectedAccountAccentId(state),
    hasCreatedAccount: AccountSelector.hasCreatedAccount(state),
    hasReachedLimitOfAccounts: AccountSelector.hasReachedLimitOfAccounts(state),
    isAddingAccount: AccountSelector.isAddingAccount(state),
    isEditAccountMenuVisible: ContextMenuSelector.isEditAccountMenuVisible(state),
  }),
  {
    addAccountWithSession,
    setAccountContextHidden,
    toggleEditAccountMenuVisibility,
  },
)(Sidebar);
