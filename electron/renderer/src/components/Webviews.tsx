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

import './Webviews.css';

import {WebviewTag} from 'electron';
import React, {Component} from 'react';

import {resetIdentity, switchAccount, updateAccountLifecycle} from '../actions';
import {ACCOUNT, ACTION, LIFECYCLE} from '../lib/eventType';
import {AccountData} from '../reducers/accountReducer';
import Webview from './Webview';

export interface Props extends React.HTMLProps<HTMLUListElement> {
  abortAccountCreation: (accountId: string) => void;
  accounts: AccountData[];
  resetIdentity: typeof resetIdentity;
  switchAccount: typeof switchAccount;
  updateAccountBadgeCount: (id: string, count: number) => void;
  updateAccountData: (id: string, data: AccountData) => void;
  updateAccountLifecycle: typeof updateAccountLifecycle;
}

export interface State {
  canDelete: Record<string, boolean>;
}

export interface IpcData {
  channel: string;
  args: any[];
}

export default class Webviews extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      canDelete: this._getCanDeletes(props.accounts),
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({canDelete: this._getCanDeletes(nextProps.accounts)});
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    for (const account of nextProps.accounts) {
      const match = this.props.accounts.find(_account => account.id === _account.id);
      if (!match) {
        return true;
      }
      // If a SSO code is set on a window, use it
      if (match.ssoCode !== account.ssoCode && account.isAdding) {
        const webviewElement: WebviewTag | null = document.querySelector(`Webview[data-accountid="${account.id}"]`);
        if (webviewElement) {
          webviewElement.loadURL(this._getEnvironmentUrl(account, false));
        }
      }
      if (match.visible !== account.visible) {
        return true;
      }
    }
    return JSON.stringify(nextState.canDelete) !== JSON.stringify(this.state.canDelete);
  }

  private readonly _getCanDeletes = (accounts: AccountData[]): Record<string, boolean> => {
    return accounts.reduce((accumulator: Record<string, boolean>, account) => {
      accumulator[account.id] = this._canDeleteWebview(account);
      return accumulator;
    }, {});
  };

  _getEnvironmentUrl(account: AccountData, forceLogin: boolean) {
    const currentLocation = new URL(window.location.href);
    const envParam = currentLocation.searchParams.get('env') || '';
    const decodedEnvParam = decodeURIComponent(envParam);
    const url = new URL(decodedEnvParam);

    // pass account id to webview so we can access it in the preload script
    url.searchParams.set('id', account.id);

    if (forceLogin || account.ssoCode) {
      url.pathname = '/auth';
    }
    if (forceLogin) {
      url.hash = '#login';
    }
    if (account.ssoCode && account.isAdding) {
      url.hash = `#sso/${account.ssoCode}`;
    }

    return url.href;
  }

  _accumulateBadgeCount(accounts: AccountData[]) {
    return accounts.reduce((accumulated, account) => accumulated + account.badgeCount, 0);
  }

  private readonly _onUnreadCountUpdated = (accountId: string, unreadCount: number) => {
    this.props.updateAccountBadgeCount(accountId, unreadCount);
    const accumulatedCount = this._accumulateBadgeCount(this.props.accounts);
    window.sendBadgeCount(accumulatedCount);
  };

  private readonly _onIpcMessage = async (account: AccountData, {channel, args}: IpcData) => {
    switch (channel) {
      case ACCOUNT.UPDATE_INFO: {
        const [accountData] = args;
        this.props.updateAccountData(account.id, accountData);
        break;
      }

      case ACTION.NOTIFICATION_CLICK: {
        this.props.switchAccount(account.id);
        break;
      }

      case LIFECYCLE.SIGNED_IN:
      case LIFECYCLE.SIGN_OUT: {
        this.props.updateAccountLifecycle(account.id, channel);
        break;
      }

      case LIFECYCLE.SIGNED_OUT: {
        const [clearData] = args;
        if (clearData) {
          await this._deleteWebview(account);
        } else {
          this.props.resetIdentity(account.id);
        }
        break;
      }

      case LIFECYCLE.UNREAD_COUNT: {
        const [badgeCount] = args;
        this._onUnreadCountUpdated(account.id, badgeCount);
        break;
      }
    }

    this.setState({canDelete: {...this.state.canDelete, [account.id]: this._canDeleteWebview(account)}});
  };

  private readonly _onWebviewClose = async (account: AccountData) => {
    await this._deleteWebview(account);
  };

  private readonly _deleteWebview = async (account: AccountData) => {
    await window.sendDeleteAccount(account.id, account.sessionID);
    this.props.abortAccountCreation(account.id);
  };

  private _canDeleteWebview(account: AccountData) {
    const match = this.props.accounts.find(_account => account.id === _account.id);
    return !match || (!match.userID && !!match.sessionID);
  }

  render() {
    return (
      <ul className="Webviews">
        {this.props.accounts.map((account, index) => (
          <div className="Webviews-container" key={account.id}>
            <Webview
              className={`Webview${account.visible ? '' : ' hide'}`}
              data-accountid={account.id}
              visible={account.visible}
              src={this._getEnvironmentUrl(account, account.isAdding && index > 0)}
              partition={account.sessionID}
              onIpcMessage={(event: IpcData) => this._onIpcMessage(account, event)}
              webpreferences="backgroundThrottling=false"
            />
            {this.state.canDelete[account.id] && account.visible && (
              <div className="Webviews-close" onClick={() => this._onWebviewClose(account)}>
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
