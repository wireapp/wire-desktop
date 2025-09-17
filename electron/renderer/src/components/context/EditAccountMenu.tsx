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

import {connect} from 'react-redux';

import ContextMenu from './ContextMenu';
import ContextMenuItem from './ContextMenuItem';

import {EVENT_TYPE} from '../../../../src/lib/eventType';
import {abortAccountCreation} from '../../actions';
import {accountAction} from '../../actions/AccountAction';
import {State} from '../../index';
import {getText} from '../../lib/locale';
import {AccountSelector} from '../../selector/AccountSelector';
import {ContextMenuSelector} from '../../selector/ContextMenuSelector';

interface EditAccountMenuProps {
  abortAccountCreation: (accountId: string) => void;
  accountId: string;
  accountIndex: number;
  isAtLeastAdmin: boolean;
  lifecycle?: string;
  sessionID?: string;
  switchWebview: (accountIndex: number) => void;
}

const EditAccountMenu = ({
  accountId,
  accountIndex,
  isAtLeastAdmin,
  lifecycle,
  sessionID,
  ...connected
}: EditAccountMenuProps) => {
  return (
    <ContextMenu>
      {/* This appears to have been broken for some time. Removing it for the time being until a proper fix can be applied
      https://wearezeta.atlassian.net/browse/FS-1124
       {isAtLeastAdmin && (
        <ContextMenuItem onClick={() => {
          window.open('https://teams.wire.com/login/');
        }}>
          {getText('wrapperManageTeam')}
        </ContextMenuItem>
      )} */}

      {lifecycle === EVENT_TYPE.LIFECYCLE.SIGNED_IN && (
        <ContextMenuItem
          onClick={() => {
            connected.switchWebview(accountIndex);
            window.wireDesktop?.sendLogoutAccount(accountId);
          }}
        >
          {getText('wrapperLogOut')}
        </ContextMenuItem>
      )}

      <ContextMenuItem
        onClick={() => {
          window.wireDesktop?.sendDeleteAccount(accountId, sessionID)?.then(() => {
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
  (state: State) => {
    const accountId = ContextMenuSelector.getAccountId(state);
    return {
      accountId,
      accountIndex: AccountSelector.getAccountIndex(state, accountId),
      isAtLeastAdmin: ContextMenuSelector.getIsAtLeastAdmin(state),
      lifecycle: ContextMenuSelector.getLifecycle(state),
      sessionID: ContextMenuSelector.getSessionId(state),
    };
  },
  {
    abortAccountCreation,
    switchWebview: accountAction.switchWebview,
  },
)(EditAccountMenu);
