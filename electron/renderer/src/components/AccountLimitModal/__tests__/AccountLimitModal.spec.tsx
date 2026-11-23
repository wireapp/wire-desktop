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

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';
import {applyMiddleware, createStore} from 'redux';
import thunk from 'redux-thunk';

import {StyledApp, THEME_ID} from '@wireapp/react-ui-kit';

import {config} from '../../../../../src/settings/config';
import {generateUUID} from '../../../lib/util';
import reducers from '../../../reducers';
import {createAccount} from '../../../reducers/accountReducer';
import AccountLimitModal from '../AccountLimitModal';

const numberOfAccountsAboveLimit = 2;

const renderModal = () => {
  const accounts = Array.from({length: config.maximumAccounts + numberOfAccountsAboveLimit}, (_, index) => ({
    ...createAccount({id: generateUUID(), sessionID: generateUUID()}),
    name: `Account ${index}`,
    userID: generateUUID(),
  }));
  const store = createStore(reducers, {accounts}, applyMiddleware(thunk));

  render(
    <Provider store={store}>
      <StyledApp themeId={THEME_ID.DEFAULT}>
        <AccountLimitModal />
      </StyledApp>
    </Provider>,
  );
  expect(queryModal()).not.toBeNull();

  return {accounts, store};
};

const getCheckbox = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const getLogOutButton = () => screen.getByRole('button', {name: 'Log out'}) as HTMLButtonElement;
const queryModal = () => document.querySelector('[data-uie-name="modal-account-limit"]');
const queryError = () => screen.queryByText('An error occurred while logging out of the accounts. Please try again.');

describe('AccountLimitModal', () => {
  beforeAll(() => {
    window.locStringsDefault = require('../../../../../src/locale/en-US.json');
  });

  beforeEach(() => {
    window.sendDeleteAccount = jest.fn().mockResolvedValue(undefined);
    // Switching to the remaining account focuses the window, which jsdom doesn't implement
    jest.spyOn(window, 'blur').mockImplementation(() => {});
    jest.spyOn(window, 'focus').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('only allows logging out once enough accounts are selected', () => {
    renderModal();

    expect(getLogOutButton().disabled).toBe(true);

    fireEvent.click(getCheckbox('Account 0'));
    expect(getLogOutButton().disabled).toBe(true);

    fireEvent.click(getCheckbox('Account 1'));
    expect(getLogOutButton().disabled).toBe(false);
    expect(getCheckbox('Account 2').disabled).toBe(true);

    fireEvent.click(getCheckbox('Account 1'));
    expect(getLogOutButton().disabled).toBe(true);
    expect(getCheckbox('Account 2').disabled).toBe(false);
  });

  it('closes without logging out when cancelled', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

    expect(queryModal()).toBeNull();
    expect(window.sendDeleteAccount).not.toHaveBeenCalled();
  });

  it('logs out of the selected accounts and closes', async () => {
    const {accounts, store} = renderModal();

    fireEvent.click(getCheckbox('Account 0'));
    fireEvent.click(getCheckbox('Account 1'));
    fireEvent.click(getLogOutButton());

    await waitFor(() => expect(queryModal()).toBeNull());
    expect(window.sendDeleteAccount).toHaveBeenCalledWith(accounts[0].id, accounts[0].sessionID);
    expect(window.sendDeleteAccount).toHaveBeenCalledWith(accounts[1].id, accounts[1].sessionID);
    expect(store.getState().accounts.map(({id}) => id)).toEqual(accounts.slice(2).map(({id}) => id));
  });

  it('keeps the accounts selected and shows an error when logging out fails', async () => {
    const {accounts, store} = renderModal();
    jest.mocked(window.sendDeleteAccount).mockRejectedValue(new Error('Webview does not exist'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    fireEvent.click(getCheckbox('Account 0'));
    fireEvent.click(getCheckbox('Account 1'));
    fireEvent.click(getLogOutButton());

    await waitFor(() => expect(queryError()).not.toBeNull());
    expect(getCheckbox('Account 0').checked).toBe(true);
    expect(getCheckbox('Account 1').checked).toBe(true);
    expect(getLogOutButton().disabled).toBe(false);
    expect(store.getState().accounts).toHaveLength(accounts.length);
  });

  it('shows logged out accounts and retries only the failed ones when logging out partially fails', async () => {
    const {accounts, store} = renderModal();
    jest
      .mocked(window.sendDeleteAccount)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Webview does not exist'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    fireEvent.click(getCheckbox('Account 0'));
    fireEvent.click(getCheckbox('Account 1'));
    fireEvent.click(getLogOutButton());

    await waitFor(() => expect(queryError()).not.toBeNull());
    expect(screen.getByText('Logged out')).not.toBeNull();
    expect(getCheckbox('Account 0').checked).toBe(true);
    expect(getCheckbox('Account 0').disabled).toBe(true);
    expect(getCheckbox('Account 1').checked).toBe(true);
    expect(getCheckbox('Account 1').disabled).toBe(false);
    expect(store.getState().accounts.some(({id}) => id === accounts[0].id)).toBe(false);

    fireEvent.click(getLogOutButton());

    await waitFor(() => expect(queryModal()).toBeNull());
    expect(window.sendDeleteAccount).toHaveBeenCalledTimes(3);
    expect(window.sendDeleteAccount).toHaveBeenLastCalledWith(accounts[1].id, accounts[1].sessionID);
  });
});
