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

import {abortAccountCreation} from '../../actions';
import {EVENT_TYPE} from '../../../../dist/lib/eventType';
import {getText} from '../../lib/locale';
import ContextMenu from './ContextMenu';
import ContextMenuItem from './ContextMenuItem';
import {ContextMenuSelector} from '../../selector/ContextMenuSelector';
import {accountAction} from '../../actions/AccountAction';
import {AccountSelector} from '../../selector/AccountSelector';

const EditAccountMenu = ({accountId, accountIndex, isAtLeastAdmin, lifecycle, sessionId, ...connected}) => {
  return (
    <ContextMenu>
      {isAtLeastAdmin && (
        <ContextMenuItem onClick={() => window.open('https://teams.wire.com/login/')}>
          {getText('wrapperManageTeam')}
        </ContextMenuItem>
      )}
      {lifecycle === EVENT_TYPE.LIFECYCLE.SIGNED_IN && (
        <ContextMenuItem
          onClick={() => {
            connected.switchWebview(accountIndex);
            window.sendLogoutAccount(accountId);
          }}
        >
          {getText('wrapperLogOut')}
        </ContextMenuItem>
      )}
      <ContextMenuItem
        onClick={() => {
          window.sendDeleteAccount(accountId, sessionId).then(() => {
            connected.abortAccountCreation(accountId);
          });
        }}
      >
        {getText('wrapperRemoveAccount')}
      </ContextMenuItem>
    </ContextMenu>
  );
};

export default connect(
  state => {
    const accountId = ContextMenuSelector.getAccountId(state);
    return {
      accountId,
      accountIndex: AccountSelector.getAccountIndex(state, accountId),
      isAtLeastAdmin: ContextMenuSelector.getIsAtLeastAdmin(state),
      lifecycle: ContextMenuSelector.getLifecycle(state),
      sessionId: ContextMenuSelector.getSessionId(state),
    };
  },
  {
    abortAccountCreation,
    switchWebview: accountAction.switchWebview,
  },
)(EditAccountMenu);
