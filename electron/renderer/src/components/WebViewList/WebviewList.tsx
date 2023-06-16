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

import './WebviewList.css';

import {updateAccountBadgeCount} from '../../actions';
import {State} from '../../index';
import {AccountSelector} from '../../selector/AccountSelector';
import {Account} from '../../types/account';
import Webview from '../WebView/Webview';

interface WebviewListProps {
  accounts: Account[];
  updateAccountBadgeCount: (id: string, count: number) => void;
}

const WebviewList = ({accounts, updateAccountBadgeCount}: WebviewListProps) => {
  return (
    <ul className="WebviewList">
      {accounts.map(account => (
        <Webview key={account.id} account={account} onUnreadCountUpdated={updateAccountBadgeCount} />
      ))}
    </ul>
  );
};

export default connect((state: State) => ({accounts: AccountSelector.getAccounts(state)}), {updateAccountBadgeCount})(
  WebviewList,
);
