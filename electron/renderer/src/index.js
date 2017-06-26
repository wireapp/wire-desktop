import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import { addAccount, switchAccount } from './actions'
import appStore from './reducers'
import { loadState, saveState } from './lib/localStorage'

const persistedState = loadState()

const store = createStore(
  appStore,
  persistedState
)

store.subscribe(() => {
  saveState({
    accounts: store.getState().accounts
  })
})

render(
  <div>foo</div>,
  document.getElementById('root')
)
