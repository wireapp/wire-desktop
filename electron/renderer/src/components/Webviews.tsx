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

import {UrlUtil} from '@wireapp/commons';
import {IpcMessageEvent} from 'electron';
import * as React from 'react';
import {Account} from '../../interfaces/';
import * as EVENT_TYPE from '../lib/eventType';
import Webview from './Webview';
import './Webviews.css';

export interface Props extends React.HTMLAttributes<HTMLDataListElement> {
  accounts: Account[];
  onClick?: (event: React.MouseEvent<HTMLDataListElement>) => void;
}

export interface DispatchProps {
  abortAccountCreation: (id: string) => void;
  switchAccount: (id: string) => void;
  updateAccountBadgeCount: (id: string, count: number) => void;
  updateAccountData: (id: string, data: Partial<Account>) => void;
  updateAccountLifecycle: (id: string, channel: string) => void;
}

export interface State {
  canDelete: {
    [id: string]: boolean;
  };
}

export type CombinedProps = Props & DispatchProps;

class Webviews extends React.Component<CombinedProps, State> {
  constructor(props: CombinedProps) {
    super(props);
    this.state = {
      canDelete: this.getCanDeletes(props.accounts),
    };
    this.getCanDeletes = this.getCanDeletes.bind(this);
    this.onUnreadCountUpdated = this.onUnreadCountUpdated.bind(this);
    this.onIpcMessage = this.onIpcMessage.bind(this);
    this.onWebviewClose = this.onWebviewClose.bind(this);
    this.deleteWebview = this.deleteWebview.bind(this);
  }

  public componentWillReceiveProps(nextProps: CombinedProps) {
    this.setState({canDelete: this.getCanDeletes(nextProps.accounts)});
  }

  public shouldComponentUpdate(nextProps: CombinedProps, nextState: State) {
    for (const account of nextProps.accounts) {
      const match = this.props.accounts.find(_account => account.id === _account.id);
      if (!match || match.visible !== account.visible) {
        return true;
      }
    }
    return JSON.stringify(nextState.canDelete) !== JSON.stringify(this.state.canDelete);
  }

  private getCanDeletes(accounts: Account[]) {
    return accounts.reduce(
      (accumulator, account) => ({
        ...accumulator,
        [account.id]: this.canDeleteWebview(account),
      }),
      {}
    );
  }

  private getEnvironmentUrl(account: Account, forceLogin?: boolean): string {
    const envParam = decodeURIComponent(UrlUtil.getURLParameter('env'));
    const url = new URL(envParam);

    // pass account id to webview so we can access it in the preload script
    url.searchParams.set('id', account.id);

    if (forceLogin) {
      const isLocalhost = url.hostname === 'localhost';
      url.pathname = isLocalhost ? '/page/auth.html' : '/auth';
      url.hash = '#login';
    }
    return url.href;
  }

  private accumulateBadgeCount(accounts: Account[]) {
    return accounts.reduce((accumulated, account) => accumulated + account.badgeCount, 0);
  }

  private onUnreadCountUpdated(accountId: string, unreadCount: number) {
    this.props.updateAccountBadgeCount(accountId, unreadCount);
    const accumulatedCount = this.accumulateBadgeCount(this.props.accounts);
    window.sendBadgeCount(accumulatedCount);
  }

  private onIpcMessage(account: Account, event: IpcMessageEvent) {
    switch (event.channel) {
      case EVENT_TYPE.ACCOUNT.UPDATE_INFO: {
        const [accountData] = event.args;
        this.props.updateAccountData(account.id, accountData);
        break;
      }

      case EVENT_TYPE.ACTION.NOTIFICATION_CLICK: {
        this.props.switchAccount(account.id);
        break;
      }

      case EVENT_TYPE.LIFECYCLE.SIGNED_IN:
      case EVENT_TYPE.LIFECYCLE.SIGN_OUT: {
        this.props.updateAccountLifecycle(account.id, event.channel);
        break;
      }

      case EVENT_TYPE.LIFECYCLE.SIGNED_OUT: {
        this.deleteWebview(account);
        break;
      }

      case EVENT_TYPE.LIFECYCLE.UNREAD_COUNT: {
        const [badgeCount] = event.args;
        this.onUnreadCountUpdated(account.id, badgeCount);
        break;
      }
    }

    this.setState({canDelete: {...this.state.canDelete, [account.id]: this.canDeleteWebview(account)}});
  }

  private onWebviewClose(account: Account) {
    this.deleteWebview(account);
  }

  private deleteWebview(account: Account) {
    window.sendDeleteAccount(account.id, account.sessionID);
    this.props.abortAccountCreation(account.id);
  }

  private canDeleteWebview(account: Account) {
    const match = this.props.accounts.find(_account => account.id === _account.id);
    return !match || (!match.userID && !!match.sessionID);
  }

  render() {
    return (
      <ul className="Webviews">
        {this.props.accounts.map((account, index) => (
          <div className="Webviews-container" key={account.id}>
            <Webview
              className={`Webview ${account.visible ? '' : 'hide'}`}
              data-accountid={account.id}
              visible={account.visible}
              src={this.getEnvironmentUrl(account, account.isAdding && index > 0)}
              partition={account.sessionID}
              preload="./static/webview-preload.js"
              onIpcMessage={(event: IpcMessageEvent) => this.onIpcMessage(account, event)}
              webpreferences="backgroundThrottling=false"
            />
            {this.state.canDelete[account.id] &&
              account.visible && (
                <div className="Webviews-close" onClick={() => this.onWebviewClose(account)}>
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path
                      d="M2.757 14.657L8 9.414l5.243 5.243 1.414-1.414L9.414 8l5.243-5.243-1.414-1.414L8 6.586 2.757 1.343 1.343 2.757 6.586 8l-5.243 5.243"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
              )}
          </div>
        ))}
      </ul>
    );
  }
}

export default Webviews;
