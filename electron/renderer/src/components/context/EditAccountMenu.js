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
import {getText} from '../../lib/locale';
import ContextMenu from './ContextMenu';
import ContextMenuItem from './ContextMenuItem';
import {abortAccountCreation, switchAccount} from '../../actions/';
import * as EVENT_TYPE from '../../lib/eventType';

function EditAccountMenu({accountId, isAtLeastAdmin, lifecycle, sessionId, ...connected}) {
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
            connected.switchAccount(accountId);
            window.sendLogoutAccount(accountId);
          }}
        >
          {getText('wrapperLogOut')}
        </ContextMenuItem>
      )}
      <ContextMenuItem
        onClick={() => {
          window.sendDeleteAccount(accountId, sessionId);
          connected.abortAccountCreation(accountId);
        }}
      >
        {getText('wrapperRemoveAccount')}
      </ContextMenuItem>
    </ContextMenu>
  );
}

export default connect(
  ({contextMenuState}) => ({
    accountId: contextMenuState.accountId,
    isAtLeastAdmin: contextMenuState.isAtLeastAdmin,
    lifecycle: contextMenuState.lifecycle,
    sessionId: contextMenuState.sessionId,
  }),
  {
    abortAccountCreation,
    switchAccount,
  }
)(EditAccountMenu);
