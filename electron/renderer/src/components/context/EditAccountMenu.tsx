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

import * as React from 'react';
import {connect} from 'react-redux';
import {abortAccountCreation, switchAccount} from '../../actions';
import * as EVENT_TYPE from '../../lib/eventType';
import {getText} from '../../lib/locale';
import {RootState, ThunkDispatch} from '../../reducers/';
import ContextMenu from './ContextMenu';
import ContextMenuItem from './ContextMenuItem';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  accountId: string;
  isAtLeastAdmin: boolean;
  lifecycle: boolean | string;
  sessionId: string;
}

export interface DispatchProps {
  abortAccountCreation: (id: string) => void;
  switchAccount: (id: string) => void;
}

export type CombinedProps = Props & DispatchProps;

const EditAccountMenu: React.SFC<CombinedProps> = ({accountId, isAtLeastAdmin, lifecycle, sessionId, ...connected}) => {
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
};

export default connect(
  (state: RootState) => ({
    accountId: state.contextMenuState.accountId,
    isAtLeastAdmin: state.contextMenuState.isAtLeastAdmin,
    lifecycle: state.contextMenuState.lifecycle,
    sessionId: state.contextMenuState.sessionId,
  }),
  (dispatch: ThunkDispatch): DispatchProps => ({
    abortAccountCreation: (id: string) => dispatch(abortAccountCreation(id)),
    switchAccount: (id: string) => dispatch(switchAccount(id)),
  })
)(EditAccountMenu);
