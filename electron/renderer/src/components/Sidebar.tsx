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
import {connect} from 'react-redux';
import {Account} from '../../interfaces/';
import {
  addAccountWithSession,
  setAccountContextHidden,
  switchAccount,
  toggleEditAccountMenuVisibility,
} from '../actions';
import {preventFocus} from '../lib/util';
import {RootState} from '../reducers/';
import AddAccountTrigger from './context/AddAccountTrigger';
import EditAccountMenu from './context/EditAccountMenu';
import PersonalIcon from './PersonalIcon';
import TeamIcon from './TeamIcon';

import './Sidebar.css';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  accounts: Account[];
  currentAccentID: string;
  hasCreatedAccount: boolean;
  hasReachedLimitOfAccounts: boolean;
  isAddingAccount: boolean;
  isEditAccountMenuVisible: boolean;
}

const centerOfEventTarget = (event: any) => {
  const cRect = event.target.getBoundingClientRect();
  return [cRect.left + cRect.width / 2, cRect.top + cRect.height / 2];
};

const getClassName = (account: Account) => {
  const showIconBadge = account.badgeCount > 0 ? ' Sidebar-icon-badge' : '';
  const showIconCursor = account.visible ? '' : ' Sidebar-icon-cursor';
  return `Sidebar-icon${showIconBadge}${showIconCursor}`;
};

const Sidebar: React.SFC<Props> = ({
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
          style={{color: AccentColor.getById(currentAccentID).color}}
          className={getClassName(account)}
          onClick={() => connected.switchAccount(account.id)}
          onContextMenu={preventFocus(event => {
            const isAtLeastAdmin = ['z.team.TeamRole.ROLE.OWNER', 'z.team.TeamRole.ROLE.ADMIN'].includes(
              account.teamRole
            );
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
      !hasReachedLimitOfAccounts && <AddAccountTrigger id="account" onClick={connected.addAccountWithSession} />}

    {isEditAccountMenuVisible && <EditAccountMenu />}
  </div>
);

export default connect(
  (state: RootState) => ({
    accounts: state.accounts,
    currentAccentID: (state.accounts.find(account => !!account.visible) || {}).accentID,
    hasCreatedAccount: state.accounts.some(account => account.userID !== undefined),
    hasReachedLimitOfAccounts: state.accounts.length >= 3,
    isAddingAccount: state.accounts.length && state.accounts.some(account => account.userID === undefined),
    isEditAccountMenuVisible: state.contextMenuState.isEditAccountMenuVisible,
  }),
  {
    addAccountWithSession,
    setAccountContextHidden,
    switchAccount,
    toggleEditAccountMenuVisibility,
  }
)(Sidebar);
