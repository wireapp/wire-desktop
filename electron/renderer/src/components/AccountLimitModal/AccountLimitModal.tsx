/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {useState} from 'react';

import {connect} from 'react-redux';

import {Button, ButtonVariant, Checkbox, CheckboxLabel, H2, Modal, Text} from '@wireapp/react-ui-kit';

import {config} from '../../../../src/settings/config';
import {abortAccountCreation} from '../../actions';
import {State} from '../../index';
import {getText} from '../../lib/locale';
import {AccountSelector} from '../../selector/AccountSelector';
import {Account} from '../../types/account';

interface AccountLimitModalProps {
  abortAccountCreation: (accountId: string) => void;
  accounts: Account[];
  numberOfAccountsAboveLimit: number;
}

const AccountLimitModal = ({accounts, numberOfAccountsAboveLimit, ...connected}: AccountLimitModalProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  if (isDismissed || numberOfAccountsAboveLimit === 0) {
    return null;
  }

  const hasSelectedEnough = selectedAccountIds.length === numberOfAccountsAboveLimit;

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds(selectedIds =>
      selectedIds.includes(accountId) ? selectedIds.filter(id => id !== accountId) : [...selectedIds, accountId],
    );
  };

  const logOut = async () => {
    setIsLoggingOut(true);
    for (const account of accounts.filter(({id}) => selectedAccountIds.includes(id))) {
      try {
        await window.sendDeleteAccount(account.id, account.sessionID);
        connected.abortAccountCreation(account.id);
      } catch (error) {
        console.error(error);
      }
    }
    setSelectedAccountIds([]);
    setIsLoggingOut(false);
  };

  return (
    <Modal onClose={() => setIsDismissed(true)} bodyStyle={{width: 420}} data-uie-name="modal-account-limit">
      <H2 style={{marginTop: 0}}>{getText('accountLimitModalTitle')}</H2>
      <Text block>
        {config.maximumAccounts === 1
          ? getText('accountLimitModalLimitSingular')
          : getText('accountLimitModalLimitPlural', {maximumAccounts: String(config.maximumAccounts)})}{' '}
        {numberOfAccountsAboveLimit === 1
          ? getText('accountLimitModalSelectSingular')
          : getText('accountLimitModalSelectPlural', {count: String(numberOfAccountsAboveLimit)})}
      </Text>
      <Text block style={{marginTop: 16}}>
        {getText('accountLimitModalBackupHint')}
      </Text>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, margin: '24px 0'}}>
        {accounts.map(account => {
          const isSelected = selectedAccountIds.includes(account.id);
          return (
            <Checkbox
              key={account.id}
              id={`account-limit-${account.id}`}
              checked={isSelected}
              disabled={isLoggingOut || (!isSelected && hasSelectedEnough)}
              onChange={() => toggleAccount(account.id)}
              data-uie-name="item-account-limit-account"
            >
              <CheckboxLabel htmlFor={`account-limit-${account.id}`}>
                {account.name || getText('sidebarAccountNameFallback')}
              </CheckboxLabel>
            </Checkbox>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 8}}>
        <Button
          variant={ButtonVariant.SECONDARY}
          disabled={isLoggingOut}
          onClick={() => setIsDismissed(true)}
          style={{flex: 1}}
          data-uie-name="do-account-limit-cancel"
        >
          {getText('accountLimitModalCancel')}
        </Button>
        <Button
          disabled={!hasSelectedEnough || isLoggingOut}
          showLoading={isLoggingOut}
          onClick={logOut}
          style={{flex: 1}}
          data-uie-name="do-account-limit-log-out"
        >
          {getText('accountLimitModalLogOut')}
        </Button>
      </div>
    </Modal>
  );
};

export default connect(
  (state: State) => ({
    accounts: AccountSelector.getCreatedAccounts(state),
    numberOfAccountsAboveLimit: AccountSelector.getNumberOfAccountsAboveLimit(state),
  }),
  {abortAccountCreation},
)(AccountLimitModal);
