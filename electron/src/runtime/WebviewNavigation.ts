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

import * as OriginValidator from './OriginValidator';
import type {NavigationEvent, NavigationOrigins} from './OriginValidator';

export type NavigationKind = 'navigation' | 'programmatic-navigation' | 'redirect';

export type NavigationDecision = {
  allowed: boolean;
  destinationOrigin: string;
  kind: NavigationKind;
};

export type RegisterNavigationEventHandlersParameters = {
  getNavigationOrigins(): NavigationOrigins;
  logNavigationDecision(decision: NavigationDecision): void;
  onDidStartNavigation(
    listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
  ): void;
  onWillNavigate(listener: (event: NavigationEvent, destinationUrl: string) => void): void;
  onWillRedirect(
    listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
  ): void;
  stopNavigation(): void;
};

export type NavigationTransactionDependencies = {
  authorizeOriginChange(destinationUrl: string, currentTrustedOrigin: string): Maybe<string>;
  commitTrustedOrigin(origin: string): void;
  getCurrentUrl(): string;
  loadUrl(destinationUrl: string): Promise<void>;
  setPendingOrigin(origin: Maybe<string>): void;
};

export type NavigateWebviewDestinationParameters = {
  currentTrustedOrigin: string;
  dependencies: NavigationTransactionDependencies;
  destinationUrl: string;
};

export type WebviewNavigationOperation = () => Promise<boolean>;
export type WebviewNavigationQueue = (operation: WebviewNavigationOperation) => Promise<boolean>;

export function registerNavigationEventHandlers(parameters: RegisterNavigationEventHandlersParameters): void {
  function handleNavigation(event: NavigationEvent, destinationUrl: string, kind: NavigationKind): void {
    const origins = parameters.getNavigationOrigins();
    const allowed = OriginValidator.preventNavigationOutsideTrustedOrigin({
      destinationUrl,
      event,
      origins,
    });
    const destinationOrigin = OriginValidator.getHttpOrigin(destinationUrl);
    const loggedOrigin = destinationOrigin.isJust ? destinationOrigin.value : 'invalid';

    parameters.logNavigationDecision({
      allowed,
      destinationOrigin: loggedOrigin,
      kind,
    });
  }

  function onWillNavigate(event: NavigationEvent, destinationUrl: string): void {
    handleNavigation(event, destinationUrl, 'navigation');
  }

  function onWillRedirect(
    event: NavigationEvent,
    destinationUrl: string,
    _isInPlace: boolean,
    isMainFrame: boolean,
  ): void {
    if (!isMainFrame) {
      return;
    }

    handleNavigation(event, destinationUrl, 'redirect');
  }

  function onDidStartNavigation(
    _event: NavigationEvent,
    destinationUrl: string,
    isInPlace: boolean,
    isMainFrame: boolean,
  ): void {
    if (!isMainFrame || isInPlace) {
      return;
    }

    const origins = parameters.getNavigationOrigins();
    const allowed = OriginValidator.isAllowedNavigation(destinationUrl, origins);
    if (!allowed) {
      parameters.stopNavigation();
    }

    const destinationOrigin = OriginValidator.getHttpOrigin(destinationUrl);
    const loggedOrigin = destinationOrigin.isJust ? destinationOrigin.value : 'invalid';
    parameters.logNavigationDecision({
      allowed,
      destinationOrigin: loggedOrigin,
      kind: 'programmatic-navigation',
    });
  }

  parameters.onWillNavigate(onWillNavigate);
  parameters.onWillRedirect(onWillRedirect);
  parameters.onDidStartNavigation(onDidStartNavigation);
}

export async function navigateWebviewDestination(parameters: NavigateWebviewDestinationParameters): Promise<boolean> {
  const destinationOrigin = parameters.dependencies.authorizeOriginChange(
    parameters.destinationUrl,
    parameters.currentTrustedOrigin,
  );
  if (destinationOrigin.isNothing) {
    return false;
  }

  parameters.dependencies.setPendingOrigin(destinationOrigin);

  try {
    await parameters.dependencies.loadUrl(parameters.destinationUrl);

    const didNavigateToAuthorizedOrigin = OriginValidator.isMatchingOrigin(
      parameters.dependencies.getCurrentUrl(),
      destinationOrigin,
    );
    if (!didNavigateToAuthorizedOrigin) {
      return false;
    }

    if (parameters.currentTrustedOrigin !== destinationOrigin.value) {
      parameters.dependencies.commitTrustedOrigin(destinationOrigin.value);
    }

    return true;
  } catch {
    return false;
  } finally {
    parameters.dependencies.setPendingOrigin(Maybe.nothing<string>());
  }
}

export function createWebviewNavigationQueue(): WebviewNavigationQueue {
  let queuedNavigation = Promise.resolve();

  async function enqueueNavigation(operation: WebviewNavigationOperation): Promise<boolean> {
    const previousNavigation = queuedNavigation;
    let releaseNavigation: () => void = () => {};
    queuedNavigation = new Promise<void>(resolve => {
      releaseNavigation = resolve;
    });

    await previousNavigation;
    try {
      return await operation();
    } finally {
      releaseNavigation();
    }
  }

  return enqueueNavigation;
}
