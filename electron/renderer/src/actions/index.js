import uuid from 'uuid/v4'

export const ADD_ACCOUNT = 'ADD_ACCOUNT'
export const SWITCH_ACCOUNT = 'SWITCH_ACCOUNT'
export const UPDATE_ACCOUNT_BADGE = 'UPDATE_ACCOUNT_BADGE'
export const DELETE_ACCOUNT = 'DELETE_ACCOUNT'

export const addAccountWithSession = () => {
  return {
    type: ADD_ACCOUNT,
    sessionID: uuid()
  }
}

export const addAccount = () => {
  return {
    type: ADD_ACCOUNT
  }
}

export const switchAccount = id => {
  return {
    type: SWITCH_ACCOUNT,
    id
  }
}

export const updateAccountBadge = (id, count) => {
  return {
    type: UPDATE_ACCOUNT_BADGE,
    id,
    count
  }
}

export const deleteAccount = id => {
  return {
    type: DELETE_ACCOUNT,
    id
  }
}
