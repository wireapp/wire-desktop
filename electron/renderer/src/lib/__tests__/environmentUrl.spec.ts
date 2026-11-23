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

import {EnvironmentUrlAccount, resolveEnvironmentUrl, resolveInitialWebviewUrl} from '../environmentUrl';

const configuredEnvironmentUrl = 'https://configured.example.test/?feature=enabled';
const rendererLocation = new URL('file:///renderer/index.html');
rendererLocation.searchParams.set('env', encodeURIComponent(configuredEnvironmentUrl));

const defaultAccount: EnvironmentUrlAccount = {
  id: '046da4f1-39be-4b8b-823b-e71f12811454',
  isAdding: false,
  ssoCode: undefined,
};

function resolveForAccount(account: EnvironmentUrlAccount, currentLocation = rendererLocation.href): string {
  return resolveEnvironmentUrl({
    account,
    currentLocation,
    locale: 'de-DE',
  });
}

describe('WebView environment URL resolution', () => {
  it('uses the configured environment when webappUrl is missing', () => {
    const account = {...defaultAccount};

    const actualUrl = resolveForAccount(account);

    expect(actualUrl).toBe(
      'https://configured.example.test/?feature=enabled&id=046da4f1-39be-4b8b-823b-e71f12811454&hl=de-DE',
    );
  });

  it('uses the configured environment when webappUrl is undefined', () => {
    const account = {...defaultAccount, webappUrl: undefined};

    const actualUrl = resolveForAccount(account);

    expect(actualUrl).toBe(
      'https://configured.example.test/?feature=enabled&id=046da4f1-39be-4b8b-823b-e71f12811454&hl=de-DE',
    );
  });

  it('uses the configured environment when webappUrl is empty', () => {
    const account = {...defaultAccount, webappUrl: ''};

    const actualUrl = resolveForAccount(account);

    expect(actualUrl).toBe(
      'https://configured.example.test/?feature=enabled&id=046da4f1-39be-4b8b-823b-e71f12811454&hl=de-DE',
    );
  });

  it('uses a valid account-specific URL before the configured environment', () => {
    const account = {...defaultAccount, webappUrl: 'https://custom.example.test/custom?setting=value'};

    const actualUrl = resolveForAccount(account);

    expect(actualUrl).toBe(
      'https://custom.example.test/custom?setting=value&id=046da4f1-39be-4b8b-823b-e71f12811454&hl=de-DE',
    );
  });

  it('does not fall back when a nonempty account-specific URL is invalid', () => {
    const account = {...defaultAccount, webappUrl: 'not a URL'};

    expect(() => resolveForAccount(account)).toThrow('The account WebApp URL is invalid');
  });

  it('fails explicitly when the configured environment URL is missing', () => {
    const locationWithoutEnvironment = 'file:///renderer/index.html';

    expect(() => resolveForAccount(defaultAccount, locationWithoutEnvironment)).toThrow(
      'The configured WebApp environment URL is missing',
    );
  });

  it('fails explicitly when the configured environment URL is invalid', () => {
    const locationWithInvalidEnvironment = 'file:///renderer/index.html?env=not-a-url';

    expect(() => resolveForAccount(defaultAccount, locationWithInvalidEnvironment)).toThrow(
      'The configured WebApp URL is invalid',
    );
  });

  it('preserves the account identifier, locale, and SSO route', () => {
    const account = {
      ...defaultAccount,
      isAdding: true,
      ssoCode: 'sso-code',
      webappUrl: 'https://custom.example.test/home?setting=value',
    };

    const actualUrl = resolveForAccount(account);

    expect(actualUrl).toBe(
      'https://custom.example.test/auth?setting=value&id=046da4f1-39be-4b8b-823b-e71f12811454&hl=de-DE#sso/sso-code',
    );
  });

  it('keeps Wire Gov without a configured URL on the no-URL screen', () => {
    const actualUrl = resolveInitialWebviewUrl({
      account: defaultAccount,
      currentLocation: 'file:///renderer/index.html',
      locale: 'de-DE',
      noUrlConfigured: true,
    });

    expect(actualUrl).toBe('');
  });
});
