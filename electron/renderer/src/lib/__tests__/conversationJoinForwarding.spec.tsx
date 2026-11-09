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

import {ipcRenderer} from 'electron';
import {flushSync} from 'react-dom';
import {createRoot, Root} from 'react-dom/client';
import {Provider} from 'react-redux';

import {WebAppEvents} from '@wireapp/webapp-events';

import {CustomProtocolHandler} from '../../../../src/lib/CoreProtocol';
import {EVENT_TYPE} from '../../../../src/lib/eventType';
import '../../../../src/preload/preload-app';
import {WindowManager} from '../../../../src/window/WindowManager';
import Webview from '../../components/WebView/Webview';
import {configureStore} from '../../configureStore';

jest.mock('electron', () => ({
  ipcRenderer: {on: jest.fn()},
  webFrame: {setVisualZoomLevelLimits: jest.fn()},
  app: {whenReady: () => Promise.resolve()},
}));
jest.mock('../../../../src/settings/config', () => ({config: {customProtocolName: 'wire'}}));
jest.mock('../../../../src/lib/showDialog', () => ({showErrorDialog: jest.fn()}));
jest.mock('../../../../src/locale', () => ({LANGUAGES: {en: {}}, getCurrent: () => 'en'}));
jest.mock('../../../../src/runtime/EnvironmentUtil', () => ({platform: {IS_MAC_OS: false}}));
jest.mock('../../../../src/sso/AutomatedSingleSignOn', () => ({}));
jest.mock('../../../../src/logging/getLogger', () => {
  const logger = {info: jest.fn(), log: jest.fn()};
  return {getLogger: () => logger};
});
jest.mock('../../components/WebView/Webview.css', () => ({}));
jest.mock('../../components/LoadingSpinner', () => ({LoadingSpinner: () => null}));
jest.mock('redux-logger', () => ({createLogger: () => () => (next: (action: unknown) => unknown) => next}));

const meeting = {kind: 'meeting' as const, domain: 'example.com', key: 'key', code: 'code'};
let root: Root | undefined;

afterEach(() => {
  root?.unmount();
  root = undefined;
  jest.useRealTimers();
  localStorage.clear();
  jest.restoreAllMocks();
  jest.clearAllMocks();
  WindowManager.actionsQueue = [];
  document.body.innerHTML = '';
});

describe('conversation join forwarding', () => {
  it.each([
    {query: '&domain=example.com', domain: 'example.com'},
    {query: '', domain: null},
  ])('marks native conversation links explicitly with domain $domain', async ({query, domain}) => {
    const dispatch = jest.spyOn(WindowManager, 'sendActionAndFocusWindow').mockResolvedValue(undefined);
    const protocol = new CustomProtocolHandler();

    await protocol['dispatchDeepLink'](`wire://conversation-join/?key=key&code=code${query}`);

    expect(dispatch).toHaveBeenCalledWith(EVENT_TYPE.ACTION.JOIN_CONVERSATION, {
      kind: 'conversation',
      key: 'key',
      code: 'code',
      domain,
    });
  });

  it('forwards a queued meeting after sign-in', async () => {
    if (registration === undefined) {
      throw new Error('Expected the preload to register its conversation join handler');
    }
    jest.useFakeTimers();
    const store = configureStore({});
    const account = store.getState().accounts[0];
    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    flushSync(() => {
      root?.render(
        <Provider store={store}>
          <Webview account={{...account, webappUrl: 'https://example.com'}} onUnreadCountUpdated={jest.fn()} />
        </Provider>,
      );
    });

    const webview = container.querySelector('webview');
    if (webview === null) {
      throw new Error('Expected the account webview to render');
    }
    const send = jest.fn(async (channel: string, data: unknown) => {
      if (channel === EVENT_TYPE.ACTION.JOIN_CONVERSATION) {
        webview.dispatchEvent(Object.assign(new Event('ipc-message'), {channel, args: [data]}));
      }
    });
    Object.assign(webview, {send});

    await flushSync(() => registration[1]({} as Electron.IpcRendererEvent, meeting));
    expect(store.getState().accounts[0].conversationJoinData).toEqual(meeting);
    expect(send).not.toHaveBeenCalledWith(WebAppEvents.CONVERSATION.JOIN, expect.anything());
    jest.advanceTimersByTime(500);
    const queuedState = JSON.parse(localStorage.getItem('state') ?? '{}');
    expect(queuedState.accounts[0].conversationJoinData).toEqual({
      kind: 'meeting',
      domain: meeting.domain,
      key: meeting.key,
      code: meeting.code,
    });

    flushSync(() => {
      webview.dispatchEvent(
        Object.assign(new Event('ipc-message'), {channel: EVENT_TYPE.LIFECYCLE.SIGNED_IN, args: []}),
      );
    });
    expect(send).toHaveBeenCalledWith(WebAppEvents.CONVERSATION.JOIN, meeting);
    expect(store.getState().accounts[0].conversationJoinData).toBeUndefined();

    jest.advanceTimersByTime(500);
    const persistedState = JSON.parse(localStorage.getItem('state') ?? '{}');
    expect(persistedState.accounts[0].conversationJoinData).toBeUndefined();
  });

  // Capture the handler registered by the production preload before clearing mock history.
  const registration = jest
    .mocked(ipcRenderer.on)
    .mock.calls.find(([channel]) => channel === EVENT_TYPE.ACTION.JOIN_CONVERSATION);

  it.each([
    {name: 'meeting', data: meeting},
    {name: 'conversation', data: {kind: 'conversation' as const, domain: 'example.com', key: 'key', code: 'code'}},
  ])('preserves the complete $name payload through the app preload', async ({data}) => {
    if (registration === undefined) {
      throw new Error('Expected the preload to register its conversation join handler');
    }
    const send = jest.fn().mockResolvedValue(undefined);
    document.body.innerHTML = '<div class="Webview" data-accountid="account"></div>';
    const webview = document.querySelector('.Webview');
    if (webview === null) {
      throw new Error('Expected an account webview');
    }
    Object.assign(webview, {send});

    await registration[1]({} as Electron.IpcRendererEvent, data);

    expect(send).toHaveBeenCalledWith(EVENT_TYPE.ACTION.JOIN_CONVERSATION, data);
    await window.sendConversationJoinToHost('account', data);
    expect(send).toHaveBeenLastCalledWith(WebAppEvents.CONVERSATION.JOIN, data);
  });

  it('delivers a queued meeting link', async () => {
    const send = jest.fn();
    const primaryWindow = {
      id: 1,
      webContents: {isLoading: () => true, send},
    };
    jest.spyOn(WindowManager, 'getPrimaryWindow').mockReturnValue(primaryWindow as unknown as Electron.BrowserWindow);

    await WindowManager.sendActionAndFocusWindow(EVENT_TYPE.ACTION.JOIN_CONVERSATION, meeting);
    expect(send).not.toHaveBeenCalled();
    expect(WindowManager.actionsQueue).toHaveLength(1);

    WindowManager.flushActionsQueue();

    expect(send).toHaveBeenCalledWith(EVENT_TYPE.ACTION.JOIN_CONVERSATION, meeting);
    expect(WindowManager.actionsQueue).toHaveLength(0);
  });
});
