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

import React from 'react'

import Webview from './Webview'
import badgeCount from '../lib/badgeCount'

import './Webviews.css'

function getEnv() {
  const url = new URL(window.location)
  const env = url.searchParams.get('env')
  return decodeURIComponent(env)
}

const Webviews = ({ accounts, onAccountBadgeUpdate }) =>
  <ul className="Webviews">
    {accounts.map(account => (
      <Webview
        key={account.id}
        className={"Webview " + (account.visible ? '' : 'hide')}
        src={getEnv()}
        partition={account.sessionID}
        preload='./static/webview-preload.js'
        onPageTitleUpdated={({title}) => {
          const count = badgeCount(title)
          if (count !== undefined) {
            onAccountBadgeUpdate(account.id, count)
          }
        }}
      />
    ))}
  </ul>

export default Webviews
