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
