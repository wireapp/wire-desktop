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

import React, {useEffect, useRef, useState} from 'react';
import {ContainerSM, H1, Logo, Text, TextLink} from '@wireapp/react-ui-kit';
import {SVGIcon} from '@wireapp/react-ui-kit/dist/Icon/SVGIcon';
import {connect} from 'react-redux';
import {EVENT_TYPE} from '../../../src/lib/eventType';
import {WindowUrl} from '../../../src/window/WindowUrl';
import {
  abortAccountCreation,
  resetIdentity,
  updateAccountBadgeCount,
  updateAccountData,
  updateAccountLifecycle,
} from '../actions';
import {getText} from '../lib/locale';
import {AccountSelector} from '../selector/AccountSelector';

import './Webview.css';
import {accountAction} from '../actions/AccountAction';

const getEnvironmentUrl = account => {
  const currentLocation = new URL(window.location.href);
  const envParam = account.webappUrl || currentLocation.searchParams.get('env');
  const decodedEnvParam = decodeURIComponent(envParam);
  const url = new URL(decodedEnvParam);

  // pass account id to webview so we can access it in the preload script
  url.searchParams.set('id', account.id);

  if (account.ssoCode && account.isAdding) {
    url.pathname = '/auth';
    url.hash = `#sso/${account.ssoCode}`;
  }

  return url.href;
};

const Webview = ({
  account,
  accountIndex,
  onUnreadCountUpdated,
  abortAccountCreation,
  resetIdentity,
  switchWebview,
  updateAccountData,
  updateAccountLifecycle,
}) => {
  const webviewRef = useRef();
  const [canDelete, setCanDelete] = useState(false);
  const [url, setUrl] = useState(getEnvironmentUrl(account));
  const [webviewError, setWebviewError] = useState(null);

  useEffect(() => {
    const newUrl = getEnvironmentUrl(account);
    if (url !== newUrl && webviewRef.current) {
      setUrl(newUrl);
      try {
        webviewRef.current.loadURL(newUrl).catch(error => console.error(`Navigating to ${newUrl} failed`, error));
      } catch (error) {
        console.warn('Can not #loadURL before attaching webview to DOM', error);
      }
    }
  }, [account]);

  // https://github.com/electron/electron/issues/14474#issuecomment-425794480
  useEffect(() => {
    const webview = webviewRef.current;
    const currentLocation = new URL(window.location.href);
    const focusParam = currentLocation.searchParams.get('focus');

    const focusWebView = () => {
      if (focusParam === 'true') {
        webview.blur();
        webview.focus();
      }
    };

    if (account.visible && webview) {
      webview.addEventListener('dom-ready', focusWebView);
    }
    return () => {
      if (webview) {
        webview.removeEventListener('dom-ready', focusWebView);
      }
    };
  }, [account, webviewRef]);

  useEffect(() => {
    setCanDelete(!account.userID && !!account.sessionID);
  }, [account]);

  useEffect(() => {
    let timeoutId;
    if (webviewError) {
      timeoutId = window.setTimeout(() => {
        setWebviewError(null);
        webviewRef.current.reload();
      }, 5000);
    }
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [webviewError]);

  useEffect(() => {
    const listener = error => {
      const urlOrigin = new URL(getEnvironmentUrl(account)).origin;
      console.warn(`Webview fired "did-fail-load" for URL "${error.validatedURL}" and account ID "${account.id}"`);
      if (error.validatedURL.startsWith(urlOrigin)) {
        setWebviewError(error);
      }
    };
    const ON_WEBVIEW_ERROR = 'did-fail-load';
    webviewRef.current.addEventListener(ON_WEBVIEW_ERROR, listener);
    return () => {
      if (webviewRef.current) {
        webviewRef.current.removeEventListener(ON_WEBVIEW_ERROR, listener);
      }
    };
  }, [webviewRef, account]);

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
          switchWebview(accountIndex);
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
      <webview
        className={`Webview${account.visible ? '' : ' hide'}`}
        data-accountid={account.id}
        visible={String(!!account.visible)}
        src={url}
        partition={account.sessionID ? `persist:${account.sessionID}` : ''}
        webpreferences="backgroundThrottling=false"
        ref={webviewRef}
      />
      {webviewError && (
        <div
          className={`Webview${account.visible ? '' : ' hide'}`}
          data-accountid={account.id}
          style={{display: 'flex'}}
        >
          <ContainerSM centerText verticalCenter data-uie-name="status-webview-error">
            <Logo scale={1.68} style={{marginBottom: '80px'}} />
            <div>
              <SVGIcon realWidth="111" realHeight="101">
                <g fill="none" fillRule="evenodd">
                  <path
                    fill="#BAC8D1"
                    d="M70.331 78.133c.715-.842 1.072-2.021 1.072-3.538v-5.99h-9.49v5.99c0 1.517.387 2.696 1.16 3.538.772.842 1.996 1.263 3.672 1.263 1.677 0 2.872-.421 3.586-1.263zm-11.61 5.073c-1.574-1.862-2.361-4.521-2.361-7.978v-6.624H35V62h42v13.66c0 3.149-.83 5.66-2.493 7.531C72.846 85.064 70.273 86 66.79 86c-3.804 0-6.494-.932-8.068-2.794z"
                  />
                  <path
                    fill="#BAC8D1"
                    d="M30.884 15.142h69.72v-4.997h-69.72v4.997zm-20.64 75.713h90.36V25.288h-90.36v65.567zm2.517-80.828c1.399 0 2.533 1.123 2.533 2.508s-1.134 2.508-2.533 2.508c-1.398 0-2.532-1.123-2.532-2.508s1.134-2.508 2.532-2.508zm10.397 0c1.399 0 2.532 1.123 2.532 2.508s-1.133 2.508-2.532 2.508-2.533-1.123-2.533-2.508 1.134-2.508 2.533-2.508zM5.162 0C2.328 0 0 2.2 0 5.007v90.958C0 98.772 2.328 101 5.162 101h100.643c2.835 0 5.195-2.228 5.195-5.035V5.007C111 2.2 108.64 0 105.805 0H5.162z"
                  />
                  <path
                    fill="#BAC8D1"
                    d="M43 47.8l-6.3-6.303 6.299-6.3L38.797 31l-6.299 6.3L26.2 31 22 35.196l6.3 6.304-6.3 6.3 4.2 4.2 6.298-6.3L38.8 52zm46 0l-6.3-6.303 6.299-6.3L84.797 31l-6.299 6.3L72.2 31 68 35.196l6.3 6.304-6.3 6.3 4.2 4.2 6.298-6.3L84.8 52z"
                  />
                </g>
              </SVGIcon>
            </div>
            <H1 center style={{marginBottom: '40px', marginTop: '40px'}}>
              {getText('webviewErrorTitle')}
            </H1>
            <Text block center>
              {getText('webviewErrorDescription', {url: new URL(webviewError.validatedURL).origin})}
            </Text>
            <Text block center>
              {getText('webviewErrorDescriptionSub')}
            </Text>
            <Text block center style={{marginTop: '32px'}}>
              {webviewError.errorDescription}
            </Text>
            <TextLink
              block
              center
              style={{marginTop: '32px'}}
              onClick={() => {
                setWebviewError(null);
                webviewRef.current.reload();
              }}
            >
              {getText('webviewErrorRetryAction')}
            </TextLink>
          </ContainerSM>
        </div>
      )}
      {canDelete && account.visible && (
        <div className="Webview-close" onClick={() => deleteWebview(account)} data-uie-name="do-close-webview">
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

export default connect((state, props) => ({accountIndex: AccountSelector.getAccountIndex(state, props.account.id)}), {
  abortAccountCreation,
  resetIdentity,
  switchWebview: accountAction.switchWebview,
  updateAccountBadgeCount,
  updateAccountData,
  updateAccountLifecycle,
})(Webview);
