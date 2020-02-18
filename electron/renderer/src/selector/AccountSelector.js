import {config as CONFIG} from '../../../dist/settings/config';

export class AccountSelector {
  static getAccounts = state => state.accounts;
  static getSelectedAccount = state => getAccounts(state).find(account => account.visible === true);
  static isAddingAccount = state =>
    !!getAccounts(state).length && getAccounts(state).some(account => account.userID === undefined);
  static hasReachedLimitOfAccounts = state => getAccounts(state).length >= CONFIG.maximumAccounts;
  static hasCreatedAccount = state => getAccounts(state).some(account => account.userID !== undefined);
}
