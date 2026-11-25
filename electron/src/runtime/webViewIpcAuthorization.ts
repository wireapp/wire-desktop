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

import {Maybe} from 'true-myth';

import {isAllowedNavigation, NavigationOrigins} from './OriginValidator';

type WebViewIpcFrame = {
  readonly url: string;
};

export type WebViewIpcSender = {
  readonly id: number;
  readonly hostWebContents: object | null;
  readonly mainFrame: WebViewIpcFrame;
  isDestroyed(): boolean;
};

export type WebViewIpcEvent = {
  readonly sender: WebViewIpcSender;
  readonly senderFrame: WebViewIpcFrame | null;
};

type WebViewIpcMainFrameEvent = WebViewIpcEvent & {
  readonly senderFrame: WebViewIpcFrame;
};

export type RegisteredWebViewContext = NavigationOrigins & {
  readonly accountId: string;
  readonly contents: WebViewIpcSender;
  readonly accountAccessRevoked: boolean;
};

export type WebViewIpcAuthorization = {
  getActiveWebViewContext(sender: WebViewIpcSender): Maybe<RegisteredWebViewContext>;
  isCurrentMainFrame(event: WebViewIpcEvent): boolean;
  authorizeWebView(event: WebViewIpcEvent): Maybe<RegisteredWebViewContext>;
};

export type CreateWebViewIpcAuthorizationDependencies = {
  getRegisteredWebViewContext(senderId: number): Maybe<RegisteredWebViewContext>;
  getWrapperWebContents(): Maybe<object>;
  isAccountRemovalInProgress(accountId: string): boolean;
};

function isCurrentMainFrame(event: WebViewIpcEvent): event is WebViewIpcMainFrameEvent {
  const {sender, senderFrame} = event;
  return senderFrame !== null && !sender.isDestroyed() && senderFrame === sender.mainFrame;
}

export function createWebViewIpcAuthorization(
  dependencies: CreateWebViewIpcAuthorizationDependencies,
): WebViewIpcAuthorization {
  function getActiveWebViewContext(sender: WebViewIpcSender): Maybe<RegisteredWebViewContext> {
    const context = dependencies.getRegisteredWebViewContext(sender.id);
    if (
      context.isNothing ||
      context.value.contents !== sender ||
      context.value.accountAccessRevoked === true ||
      dependencies.isAccountRemovalInProgress(context.value.accountId)
    ) {
      return Maybe.nothing();
    }

    return context;
  }

  function authorizeWebView(event: WebViewIpcEvent): Maybe<RegisteredWebViewContext> {
    if (!isCurrentMainFrame(event)) {
      return Maybe.nothing();
    }

    const {sender, senderFrame} = event;
    const context = getActiveWebViewContext(sender);
    const wrapper = dependencies.getWrapperWebContents();
    if (
      context.isNothing ||
      wrapper.isNothing ||
      sender.hostWebContents !== wrapper.value ||
      !isAllowedNavigation(senderFrame.url, context.value)
    ) {
      return Maybe.nothing();
    }

    return context;
  }

  return {getActiveWebViewContext, isCurrentMainFrame, authorizeWebView};
}
