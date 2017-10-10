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
    sessionID: sessionID,
    type: ADD_ACCOUNT,
  };
};

export const updateAccount = (id, data) => {
  return {
    data,
    id,
    type: UPDATE_ACCOUNT,
  };
};

export const switchAccount = id => {
  return {
    id,
    type: SWITCH_ACCOUNT,
  };
};

export const updateAccountBadge = (id, count) => {
  return {
    count,
    id,
    type: UPDATE_ACCOUNT_BADGE,
  };
};

export const deleteAccount = id => {
  return {
    id,
    type: DELETE_ACCOUNT,
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
    const validatedAccountData = verifyObjectProperties(data, {
      'accentID': 'Number',
      'name': 'String',
      'picture': 'String',
      'teamID': 'String',
      'userID': 'String',
    });

    if (validatedAccountData) {
      dispatch(updateAccount(id, validatedAccountData));
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
