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

import React, { Component } from 'react'

import Webview from './Webview'
import badgeCount from '../lib/badgeCount'

import './Webviews.css'

class Webviews extends Component {
  constructor(props) {
    super(props)
  }

  _getEnvironmentUrl() {
    const url = new URL(window.location)
    const env = url.searchParams.get('env')
    return decodeURIComponent(env)
  }

  _onPageTitleUpdated(account, { title }) {
    const count = badgeCount(title)
    if (count !== undefined) {
      this.props.updateAccountBadge(account.id, count)

      const accumulatedCount = this.props.accounts.reduce((accumulated, account) => {
        return accumulated + account.badgeCount
      }, 0)

      window.reportBadgeCount(accumulatedCount)
    }
  }

  _onIpcMessage(account, {channel, args}) {
    switch (channel) {
      case 'team-info':
        this.props.updateAccount(account.id, args[0])
        break;
    }
  }

  render() {
    return (
      <ul className="Webviews">
        {this.props.accounts.map((account) => (
          <Webview
            key={account.id}
            className={"Webview " + (account.visible ? '' : 'hide')}
            src={this._getEnvironmentUrl()}
            partition={account.sessionID}
            preload='./static/webview-preload.js'
            onPageTitleUpdated={(event) => this._onPageTitleUpdated(account, event)}
            onIpcMessage={(event) => this._onIpcMessage(account, event)}
          />
        ))}
      </ul>
    )
  }
}

export default Webviews
