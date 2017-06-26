import uuid from 'uuid/v4'

function createAccount(sessionID) {
  return {
    id: uuid(),
    teamID: undefined,
    userID: undefined,
    sessionID: sessionID,
    picture: undefined,
    name: undefined,
    visible: true,
    accentId: undefined,
    badgeCount: 0
  }
}

const accounts = (state = [createAccount()], action) => {
  switch (action.type) {
    case 'ADD_ACCOUNT':
      return [
        ...state.map(account => ({ ...account, visible: false })),
        createAccount(action.sessionID)
      ]
    case 'UPDATE_ACCOUNT_BADGE':
      return state.map(account => {
        return (account.id === action.id)
          ? { ...account, badgeCount: action.count }
          : account
      })
    case 'SWITCH_ACCOUNT':
      return state.map(account => {
        return {
          ...account,
          visible: account.id === action.id
        }
      })
    case 'DELETE_ACCOUNT':
      return [
        ...state.slice(0, action.payload.id),
        ...state.slice(action.payload.id + 1)
      ]
    default:
      return state
  }
}

export default accounts
