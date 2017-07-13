import uuid from 'uuid/v4';
import verifyObjectProperties from '../lib/verifyObjectProperties';

export const ADD_ACCOUNT = 'ADD_ACCOUNT';
export const SWITCH_ACCOUNT = 'SWITCH_ACCOUNT';
export const UPDATE_ACCOUNT = 'UPDATE_ACCOUNT';
export const UPDATE_ACCOUNT_BADGE = 'UPDATE_ACCOUNT_BADGE';
export const DELETE_ACCOUNT = 'DELETE_ACCOUNT';

export const addAccount = (withSession = true) => {
  const sessionID = withSession ? uuid() : undefined;
  return {
    type: ADD_ACCOUNT,
    sessionID: sessionID,
  };
};

export const updateAccount = (id, data) => {
  return {
    type: UPDATE_ACCOUNT,
    id,
    data,
  };
};

export const switchAccount = id => {
  return {
    type: SWITCH_ACCOUNT,
    id,
  };
};

export const updateAccountBadge = (id, count) => {
  return {
    type: UPDATE_ACCOUNT_BADGE,
    id,
    count,
  };
};

export const deleteAccount = id => {
  return {
    type: DELETE_ACCOUNT,
    id,
  };
};

export const abortAccountCreation = (id) => {
  return (dispatch, getState) => {
    dispatch(deleteAccount(id));

    const accounts = getState().accounts;
    const lastAccount = accounts[accounts.length - 1];

    if (lastAccount) {
      dispatch(switchAccount(lastAccount.id));
    } else {
      dispatch(addAccount(false));
    }
  };
};

export const updateAccountData = (id, data) => {
  return (dispatch, getState) => {
    const isValidAccountData = verifyObjectProperties(data, {
      'teamID': 'String',
      'userID': 'String',
      'picture': 'String',
      'name': 'String',
      'accentID': 'Number',
    });

    if (isValidAccountData) {
      dispatch(updateAccount(id, data));
    } else {
      console.warn(`Got invalid account data ${JSON.stringify(data)}`);
    }
  };
};

export const updateAccountBadgeCount = (id, count) => {
  return (dispatch, getState) => {
    const account = getState().accounts.find((acc) => acc.id === id);

    if (account) {
      const countHasChanged = account.badgeCount !== count;
      if (countHasChanged) {
        dispatch(updateAccountBadge(id, count));
      }
    } else {
      console.warn('Missing account when updating badge count');
    }

  };
};

export const addAccountWithSession = () => {
  return (dispatch, getState) => {
    const hasReachedAccountLimit = getState().accounts.length >= 3;

    if (hasReachedAccountLimit) {
      console.warn('Reached number of maximum accounts');
    } else {
      dispatch(addAccount());
    }
  };
};
