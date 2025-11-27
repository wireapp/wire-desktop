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

import React, {CSSProperties, useEffect, useRef} from 'react';

import {connect} from 'react-redux';

import './Sidebar.css';

import {EVENT_TYPE} from '../../../../src/lib/eventType';
import {addAccountWithSession, setAccountContextHidden, toggleEditAccountMenuVisibility} from '../../actions';
import {State} from '../../index';
import {colorFromId} from '../../lib/accentColor';
import {isEnterKey} from '../../lib/keyboardUtil';
import {getText} from '../../lib/locale';
import {preventFocus} from '../../lib/util';
import {AccountSelector} from '../../selector/AccountSelector';
import {ContextMenuSelector} from '../../selector/ContextMenuSelector';
import {Account} from '../../types/account';
import {ContextMenuState} from '../../types/contextMenuState';
import {AccountIcon} from '../AccountIcon';
import AddAccountTrigger from '../context/AddAccountTrigger';
import EditAccountMenu from '../context/EditAccountMenu';

const centerOfTarget = (target: Element) => {
  const clientRectangle = target.getBoundingClientRect();
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
  window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex: accountIndex}}));
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
}: SidebarProps) => {
  const menuTriggerRef = useRef<HTMLElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (!isEditAccountMenuVisible && shouldRestoreFocusRef.current && menuTriggerRef.current) {
      menuTriggerRef.current.focus();
      shouldRestoreFocusRef.current = false;
    }
  }, [isEditAccountMenuVisible]);

  const showAccountContextMenu = (target: Element, account: Account, shouldAutoFocus = false) => {
    const {centerX, centerY} = centerOfTarget(target);
    const isAtLeastAdmin =
      account.teamRole === 'z.team.TeamRole.ROLE.OWNER' || account.teamRole === 'z.team.TeamRole.ROLE.ADMIN';

    menuTriggerRef.current = target as HTMLElement;
    shouldRestoreFocusRef.current = shouldAutoFocus;

    connected.toggleEditAccountMenuVisibility({
      position: {
        centerY,
        centerX,
      },
      isAtLeastAdmin,
      accountId: account.id,
      sessionID: account.sessionID,
      lifecycle: account.lifecycle,
      shouldAutoFocus,
    });
  };

  const accountLabel = (account: Account) => {
    const accountType = account.teamID ? getText('sidebarAccountTypeTeam') : getText('sidebarAccountTypePersonal');
    const accountName = account.name || getText('sidebarAccountNameFallback');
    const selectionState = account.visible ? getText('sidebarAccountSelected') : getText('sidebarAccountUnselected');
    return getText('sidebarAccountLabel', {accountType, accountName, selectionState});
  };

  return (
    <div
      className={`${isDarkMode ? 'Sidebar theme-dark' : 'Sidebar theme-light'}`}
      style={
        {
          '--account-accent-color': colorFromId(currentAccentID),
          ...(hasCreatedAccount ? {} : {display: 'none'}),
        } as CSSProperties
      }
    >
      {accounts.map(account => {
        const accountIndex = accounts.indexOf(account);
        const hasNotifications = account.badgeCount > 0;
        const notificationDescriptionId = hasNotifications ? `sidebar-badge-${account.id}` : undefined;
        const notificationText = hasNotifications ? getText('sidebarAccountNotification') : undefined;
        return (
          <div className="Sidebar-cell" key={account.id}>
            <div
              role="button"
              className={getClassName(account)}
              tabIndex={0}
              data-account-id={account.id}
              onClick={preventFocus(() => handleSwitchAccount(accountIndex))}
              aria-describedby={notificationDescriptionId}
              onKeyDown={event => {
                if (isEnterKey(event)) {
                  handleSwitchAccount(accountIndex);
                  return;
                }

                const isContextMenuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
                if (isContextMenuKey) {
                  event.preventDefault();
                  event.stopPropagation();
                  showAccountContextMenu(event.currentTarget, account, true);
                }
              }}
              onContextMenu={preventFocus((event: React.MouseEvent<Element, MouseEvent>) => {
                showAccountContextMenu(event.currentTarget, account);
              })}
              onMouseDown={preventFocus()}
              aria-label={accountLabel(account)}
            >
              {hasNotifications && (
                <span id={notificationDescriptionId} className="visually-hidden">
                  {notificationText}
                </span>
              )}
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
};

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
