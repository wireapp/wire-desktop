import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import App from './components/App'
import { addAccount, switchAccount } from './actions'
import appStore from './reducers'
import { loadState, saveState } from './lib/localStorage'

import './index.css'

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
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
