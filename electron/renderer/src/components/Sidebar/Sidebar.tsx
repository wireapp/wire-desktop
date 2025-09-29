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

import './Sidebar.css';

import {EVENT_TYPE} from '../../../../src/lib/eventType';
import {addAccountWithSession, setAccountContextHidden, toggleEditAccountMenuVisibility} from '../../actions';
import {State} from '../../index';
import {colorFromId} from '../../lib/accentColor';
import {isEnterKey} from '../../lib/keyboardUtil';
import {preventFocus} from '../../lib/util';
import {AccountSelector} from '../../selector/AccountSelector';
import {ContextMenuSelector} from '../../selector/ContextMenuSelector';
import {Account} from '../../types/account';
import {ContextMenuState} from '../../types/contextMenuState';
import {AccountIcon} from '../AccountIcon';
import AddAccountTrigger from '../context/AddAccountTrigger';
import EditAccountMenu from '../context/EditAccountMenu';

const centerOfEventTarget = (event: React.MouseEvent<Element, MouseEvent>) => {
  const clientRectangle = event.currentTarget.getBoundingClientRect();
  const centerX = clientRectangle.left + clientRectangle.width / 2;
  const centerY = clientRectangle.top + clientRectangle.height / 2;
  return {centerX, centerY};
};

const getClassName = (account: Account) => {
  const showIconBadge = account.badgeCount > 0 ? ' Sidebar-icon-badge' : '';
  const showIconCursor = account.visible ? '' : ' Sidebar-icon-cursor';
  return `Sidebar-icon${showIconBadge}${showIconCursor}`;
};

const handleSwitchAccount = (accountIndex: number) => {
  globalThis.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex: accountIndex}}));
};

interface SidebarProps {
  accounts: Account[];
  currentAccentID?: number;
  hasCreatedAccount: boolean;
  hasReachedLimitOfAccounts: boolean;
  isAddingAccount: boolean;
  isDarkMode?: boolean;
  isEditAccountMenuVisible?: boolean;
  setAccountContextHidden: () => void;
  toggleEditAccountMenuVisibility: (contextMenuState: ContextMenuState) => void;
  addAccountWithSession: () => void;
}

const DEFAULT_ACCENT_ID = 1;

const Sidebar = ({
  accounts,
  currentAccentID = DEFAULT_ACCENT_ID,
  isDarkMode = false,
  hasCreatedAccount,
  hasReachedLimitOfAccounts,
  isAddingAccount,
  isEditAccountMenuVisible = false,
  ...connected
}: SidebarProps) => (
  <div
    role="button"
    tabIndex={0}
    className={`${isDarkMode ? 'Sidebar theme-dark' : 'Sidebar theme-light'}`}
    style={hasCreatedAccount ? {} : {display: 'none'}}
    onMouseDown={preventFocus()}
    onKeyDown={connected.setAccountContextHidden}
    onClick={connected.setAccountContextHidden}
  >
    {accounts.map(account => {
      const accountIndex = accounts.indexOf(account);
      return (
        <div className="Sidebar-cell" key={account.id}>
          <div
            role="button"
            style={{color: colorFromId(currentAccentID)}}
            className={getClassName(account)}
            tabIndex={0}
            onClick={preventFocus(() => handleSwitchAccount(accountIndex))}
            onKeyDown={event => {
              if (isEnterKey(event)) {
                handleSwitchAccount(accountIndex);
              }
            }}
            onContextMenu={preventFocus((event: React.MouseEvent<Element, MouseEvent>) => {
              const isAtLeastAdmin =
                account.teamRole === 'z.team.TeamRole.ROLE.OWNER' || account.teamRole === 'z.team.TeamRole.ROLE.ADMIN';
              const {centerX, centerY} = centerOfEventTarget(event);

              connected.toggleEditAccountMenuVisibility({
                position: {
                  centerY,
                  centerX,
                },
                isAtLeastAdmin,
                accountId: account.id,
                sessionID: account.sessionID,
                lifecycle: account.lifecycle,
              });
            })}
            onMouseDown={preventFocus()}
          >
            <AccountIcon account={account} />
          </div>
        </div>
      );
    })}

    {!isAddingAccount && !hasReachedLimitOfAccounts && (
      <AddAccountTrigger id="account" onClick={connected.addAccountWithSession} />
    )}

    {isEditAccountMenuVisible && <EditAccountMenu />}
  </div>
);

export default connect(
  (state: State) => ({
    accounts: AccountSelector.getAccounts(state),
    currentAccentID: AccountSelector.getSelectedAccountAccentId(state),
    hasCreatedAccount: AccountSelector.hasCreatedAccount(state),
    hasReachedLimitOfAccounts: AccountSelector.hasReachedLimitOfAccounts(state),
    isAddingAccount: AccountSelector.isAddingAccount(state),
    isDarkMode: AccountSelector.getSelectedAccountDarkMode(state),
    isEditAccountMenuVisible: ContextMenuSelector.isEditAccountMenuVisible(state),
  }),
  {
    addAccountWithSession,
    setAccountContextHidden,
    toggleEditAccountMenuVisibility,
  },
)(Sidebar);
