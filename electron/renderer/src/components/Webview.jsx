/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import './Webview.css';

import React, {useEffect, useState, useRef} from 'react';
import {ContainerSM, Text, H1, Logo} from '@wireapp/react-ui-kit';

import {EVENT_TYPE} from '../../../src/lib/eventType';
import {WindowUrl} from '../../../src/window/WindowUrl';
import {connect} from 'react-redux';
import {
  abortAccountCreation,
  resetIdentity,
  switchAccount,
  updateAccountBadgeCount,
  updateAccountData,
  updateAccountLifecycle,
} from '../actions';

const Webview = ({
  account,
  onUnreadCountUpdated,
  abortAccountCreation,
  resetIdentity,
  switchAccount,
  updateAccountBadgeCount,
  updateAccountData,
  updateAccountLifecycle,
}) => {
  const webviewRef = useRef();
  const [canDelete, setCanDelete] = useState(false);
  const [url, setUrl] = useState('');
  const [webviewError, setWebviewError] = useState(null);

  useEffect(() => {
    setCanDelete(!account.userID && !!account.sessionID);

    const getEnvironmentUrl = () => {
      const currentLocation = new URL(window.location.href);
      const envParam = account.webappUrl || currentLocation.searchParams.get('env');
      const decodedEnvParam = decodeURIComponent(envParam);
      const url = new URL(decodedEnvParam);

      // pass account id to webview so we can access it in the preload script
      url.searchParams.set('id', account.id);

      if (account.ssoCode && account.isAdding) {
        url.hash = `#sso/${account.ssoCode}`;
      }

      return url.href;
    };
    const newUrl = getEnvironmentUrl();
    if (url !== newUrl && webviewRef.current) {
      setUrl(newUrl);
      try {
        // can't load URL before webview is not attached to the DOM
        webviewRef.current.loadURL(newUrl).catch(error => console.info(`Navigating to ${newUrl} failed`, error));
      } catch (error) {
        console.info('Can not #loadURL before attaching webview to DOM', error);
      }
    }
  }, [account]);

  useEffect(() => {
    const listener = () => setIsHidden(true);
    window.addEventListener(EVENT_TYPE.PREFERENCES.SET_HIDDEN, listener, false);
    return () => {
      window.removeEventListener(EVENT_TYPE.PREFERENCES.SET_HIDDEN, listener);
    };
  }, []);

  useEffect(() => {
    const listener = error => setWebviewError(error);
    const ON_WEBVIEW_ERROR = 'did-fail-load';
    webviewRef.current.addEventListener(ON_WEBVIEW_ERROR, listener);
    return () => {
      if (webviewRef.current) {
        webviewRef.current.removeEventListener(ON_WEBVIEW_ERROR, listener);
      }
    };
  }, []);

  useEffect(() => {
    const onIpcMessage = ({channel, args}) => {
      switch (channel) {
        case EVENT_TYPE.WRAPPER.NAVIGATE_WEBVIEW: {
          const [customUrl] = args;
          const accountId = account.id;
          const updatedWebapp = WindowUrl.createWebappUrl(window.location, customUrl);
          updateAccountData(accountId, {
            webappUrl: decodeURIComponent(updatedWebapp),
          });
          break;
        }

        case EVENT_TYPE.ACCOUNT.UPDATE_INFO: {
          const [accountData] = args;
          updateAccountData(account.id, accountData);
          break;
        }

        case EVENT_TYPE.ACTION.NOTIFICATION_CLICK: {
          switchAccount(account.id);
          break;
        }

        case EVENT_TYPE.LIFECYCLE.SIGNED_IN:
        case EVENT_TYPE.LIFECYCLE.SIGN_OUT: {
          updateAccountLifecycle(account.id, channel);
          break;
        }

        case EVENT_TYPE.LIFECYCLE.SIGNED_OUT: {
          const [clearData] = args;
          if (clearData) {
            deleteWebview(account);
          } else {
            resetIdentity(account.id);
          }
          break;
        }

        case EVENT_TYPE.LIFECYCLE.UNREAD_COUNT: {
          const [badgeCount] = args;
          onUnreadCountUpdated(account.id, badgeCount);
          break;
        }
      }
    };
    const ON_IPC_MESSAGE = 'ipc-message';
    webviewRef.current.addEventListener(ON_IPC_MESSAGE, onIpcMessage);
    return () => {
      if (webviewRef.current) {
        webviewRef.current.removeEventListener(ON_IPC_MESSAGE, onIpcMessage);
      }
    };
  }, []);

  const deleteWebview = account => {
    window.sendDeleteAccount(account.id, account.sessionID).then(() => {
      abortAccountCreation(account.id);
    });
  };

  return (
    <>
      {webviewError ? (
        <webview
          className={`Webview${account.visible ? '' : ' hide'}`}
          data-accountid={account.id}
          style={{display: 'flex'}}
        >
          <ContainerSM centerText verticalCenter>
            <Logo style={{marginBottom: '48px'}} />
            <H1 center>{`This server can't be reached`}</H1>
            <Text block center>{`We can't connect to the server at "${
              new URL(webviewError.validatedURL).origin
            }"`}</Text>
            <Text block center>
              {'Let your server administrator know about this issue.'}
            </Text>
            <Text block center style={{marginTop: '32px'}}>
              {webviewError.errorDescription}
            </Text>
          </ContainerSM>
        </webview>
      ) : (
        <webview
          className={`Webview${account.visible ? '' : ' hide'}`}
          data-accountid={account.id}
          visible={!!account.visible}
          src={url}
          partition={account.sessionID ? `persist:${account.sessionID}` : ''}
          webpreferences="backgroundThrottling=false"
          ref={webviewRef}
        />
      )}
      {canDelete && account.visible && (
        <div className="Webview-close" onClick={() => deleteWebview(account)}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M2.757 14.657L8 9.414l5.243 5.243 1.414-1.414L9.414 8l5.243-5.243-1.414-1.414L8 6.586 2.757 1.343 1.343 2.757 6.586 8l-5.243 5.243"
              fillRule="evenodd"
            />
          </svg>
        </div>
      )}
    </>
  );
};

export default connect(state => ({accounts: state.accounts}), {
  abortAccountCreation,
  resetIdentity,
  switchAccount,
  updateAccountBadgeCount,
  updateAccountData,
  updateAccountLifecycle,
})(Webview);
