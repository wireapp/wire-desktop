/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

import React, { Component } from 'react';

import Webview from './Webview';
import badgeCount from '../lib/badgeCount';

import './Webviews.css';

class Webviews extends Component {
  constructor(props) {
    super(props);
  }

  _getEnvironmentUrl(account) {
    const envParam = decodeURIComponent(new URL(window.location).searchParams.get('env'));
    const url = new URL(envParam);

    // pass account id to webview so we can access it in the preload script
    url.searchParams.set('id', account.id);

    // redirect to auth page if user is unknown
    if (account.userID === undefined) {
      url.pathname = '/auth';
    }

    return url.href;
  }

  _accumulateBadgeCount(accounts) {
    return accounts.reduce((accumulated, account) => {
      return accumulated + account.badgeCount;
    }, 0);
  }

  _onPageTitleUpdated(account, { title }) {
    const count = badgeCount(title);
    if (count !== undefined) {
      this.props.updateAccountBadge(account.id, count);
      const accumulatedCount = this._accumulateBadgeCount(this.props.account);
      window.reportBadgeCount(accumulatedCount);
    }
  }

  _onIpcMessage(account, {channel, args}) {
    switch (channel) {
      case 'team-info':
        this.props.updateAccountData(account.id, args[0]);
        break;
    }
  }

  _onWebviewClose(account) {
    this.props.abortAccountCreation(account.id);
  }

  _canDeleteWebview(account) {
    return !account.userID && account.sessionID;
  }

  render() {
    return (
      <ul className="Webviews">
        {this.props.accounts.map((account) => (
          <div className="Webviews-container" key={account.id}>
            <Webview
              className={'Webview ' + (account.visible ? '' : 'hide')}
              src={this._getEnvironmentUrl(account)}
              partition={account.sessionID}
              preload='./static/webview-preload.js'
              onPageTitleUpdated={(event) => this._onPageTitleUpdated(account, event)}
              onIpcMessage={(event) => this._onIpcMessage(account, event)}
            />
            {(this._canDeleteWebview(account)) &&
              <div className="Webviews-close" onClick={() => this._onWebviewClose(account)}>
                <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.757 14.657L8 9.414l5.243 5.243 1.414-1.414L9.414 8l5.243-5.243-1.414-1.414L8 6.586 2.757 1.343 1.343 2.757 6.586 8l-5.243 5.243" fillRule="evenodd"/>
                </svg>
              </div>
            }
          </div>
        ))}
      </ul>
    );
  }
}

export default Webviews;
