import {config as CONFIG} from '../../../dist/settings/config';

export class AccountSelector {
  static getAccounts = state => state.accounts;
  static getSelectedAccount = state => AccountSelector.getAccounts(state).find(account => account.visible === true);
  static getSelectedAccountAccentId = state => AccountSelector.getSelectedAccount(state)?.accentID;
  static isAddingAccount = state =>
    !!AccountSelector.getAccounts(state).length &&
    AccountSelector.getAccounts(state).some(account => account.userID === undefined);
  static hasReachedLimitOfAccounts = state => AccountSelector.getAccounts(state).length >= CONFIG.maximumAccounts;
  static hasCreatedAccount = state => AccountSelector.getAccounts(state).some(account => account.userID !== undefined);
}
