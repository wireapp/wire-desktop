/*
 * Wire
 * Copyright (C) 2025 Wire Swiss GmbH
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

import * as assert from 'assert';

import {
  getManagedConfig,
  getManagedConfigForRenderer,
  getManagedSettingOverride,
  isSettingManaged,
  normalizeManagedConfig,
  parseRegistryNumber,
  parseRegistryValue,
  redactProxyCredentials,
  type ManagedConfigResult,
  type ManagedConfigSource,
} from './ManagedConfig';
import {SettingsType} from './SettingsType';

describe('ManagedConfig', () => {
  describe('parseRegistryNumber', () => {
    it('returns undefined for empty or whitespace', () => {
      assert.strictEqual(parseRegistryNumber(''), undefined);
      assert.strictEqual(parseRegistryNumber('   '), undefined);
    });
    it('parses decimal numbers', () => {
      assert.strictEqual(parseRegistryNumber('0'), 0);
      assert.strictEqual(parseRegistryNumber('1'), 1);
      assert.strictEqual(parseRegistryNumber('42'), 42);
    });
    it('parses hex numbers', () => {
      assert.strictEqual(parseRegistryNumber('0x0'), 0);
      assert.strictEqual(parseRegistryNumber('0x1'), 1);
      assert.strictEqual(parseRegistryNumber('0x2A'), 42);
    });
    it('returns undefined for invalid input', () => {
      assert.strictEqual(parseRegistryNumber('abc'), undefined);
      assert.strictEqual(parseRegistryNumber('0xGH'), undefined);
    });
  });

  describe('parseRegistryValue', () => {
    it('returns string value for expectedType string', () => {
      assert.strictEqual(
        parseRegistryValue({type: 'REG_SZ', value: '  https://app.wire.com  '}, 'string'),
        'https://app.wire.com',
      );
    });
    it('returns boolean for REG_DWORD', () => {
      assert.strictEqual(parseRegistryValue({type: 'REG_DWORD', value: '0'}, 'boolean'), false);
      assert.strictEqual(parseRegistryValue({type: 'REG_DWORD', value: '1'}, 'boolean'), true);
      assert.strictEqual(parseRegistryValue({type: 'REG_DWORD', value: '0x0'}, 'boolean'), false);
      assert.strictEqual(parseRegistryValue({type: 'REG_DWORD', value: '0x1'}, 'boolean'), true);
    });
    it('returns boolean for string true/false', () => {
      assert.strictEqual(parseRegistryValue({type: 'REG_SZ', value: 'true'}, 'boolean'), true);
      assert.strictEqual(parseRegistryValue({type: 'REG_SZ', value: 'false'}, 'boolean'), false);
      assert.strictEqual(parseRegistryValue({type: 'REG_SZ', value: 'yes'}, 'boolean'), true);
      assert.strictEqual(parseRegistryValue({type: 'REG_SZ', value: 'no'}, 'boolean'), false);
    });
    it('returns undefined for empty value', () => {
      assert.strictEqual(parseRegistryValue({type: 'REG_SZ', value: ''}, 'string'), undefined);
    });
  });

  describe('redactProxyCredentials', () => {
    it('strips username and password from URL', () => {
      assert.strictEqual(
        redactProxyCredentials('https://user:secret@proxy.example.com:8080/'),
        'https://proxy.example.com:8080/',
      );
    });
    it('returns URL unchanged when no credentials', () => {
      const url = 'https://proxy.example.com:8080/';
      assert.strictEqual(redactProxyCredentials(url), url);
    });
    it('handles invalid URL by returning original', () => {
      const invalid = 'not-a-url';
      assert.strictEqual(redactProxyCredentials(invalid), invalid);
    });
  });

  describe('normalizeManagedConfig', () => {
    it('strips unknown keys; valid keys are preserved', () => {
      const source: ManagedConfigSource = {platform: 'windows', location: 'HKCU\\...'};
      const raw = {
        webappUrl: 'https://app.wire.com',
        invalidKey: 'ignored',
      };
      const result = normalizeManagedConfig(raw, source);
      assert.strictEqual(result.config.webappUrl, 'https://app.wire.com');
      assert.ok(!('invalidKey' in result.config));
    });
    it('accepts valid keys', () => {
      const source: ManagedConfigSource = {platform: 'macos'};
      const raw = {
        webappUrl: 'https://app.wire.com',
        disableAutoUpdate: true,
        locale: 'en',
      };
      const result = normalizeManagedConfig(raw, source);
      assert.strictEqual(result.config.webappUrl, 'https://app.wire.com');
      assert.strictEqual(result.config.disableAutoUpdate, true);
      assert.strictEqual(result.config.locale, 'en');
      assert.strictEqual(result.source.platform, 'macos');
    });
  });

  describe('getManagedConfig with override (test seam)', () => {
    const fixture: ManagedConfigResult = {
      config: {
        webappUrl: 'https://custom.example.com',
        proxyServerUrl: 'https://proxy.example.com',
        downloadPath: 'Downloads',
        locale: 'de',
      },
      source: {platform: 'windows'},
    };

    afterEach(() => {
      getManagedConfig({config: {}, source: {platform: 'unknown'}});
    });

    it('getManagedSettingOverride returns managed value when override is set', () => {
      getManagedConfig(fixture);
      assert.strictEqual(
        getManagedSettingOverride<string>(SettingsType.CUSTOM_WEBAPP_URL),
        'https://custom.example.com',
      );
      assert.strictEqual(getManagedSettingOverride<string>(SettingsType.DOWNLOAD_PATH), 'Downloads');
      assert.strictEqual(getManagedSettingOverride<string>(SettingsType.LOCALE), 'de');
    });
    it('getManagedSettingOverride returns undefined for unset setting', () => {
      getManagedConfig(fixture);
      assert.strictEqual(getManagedSettingOverride<string>(SettingsType.PROXY_SERVER_URL), 'https://proxy.example.com');
      assert.strictEqual(getManagedSettingOverride<string>(SettingsType.ENABLE_SPELL_CHECKING), undefined);
    });
    it('isSettingManaged returns true for keys in override config', () => {
      getManagedConfig(fixture);
      assert.strictEqual(isSettingManaged(SettingsType.CUSTOM_WEBAPP_URL), true);
      assert.strictEqual(isSettingManaged(SettingsType.LOCALE), true);
      assert.strictEqual(isSettingManaged(SettingsType.ENABLE_SPELL_CHECKING), false);
    });
    it('getManagedConfigForRenderer redacts proxy credentials', () => {
      const withCredentials: ManagedConfigResult = {
        config: {
          ...fixture.config,
          proxyServerUrl: 'https://user:secret@proxy.example.com:8080/',
        },
        source: fixture.source,
      };
      getManagedConfig(withCredentials);
      const forRenderer = getManagedConfigForRenderer();
      assert.strictEqual(forRenderer.webappUrl, 'https://custom.example.com');
      assert.ok(forRenderer.proxyServerUrl?.includes('proxy.example.com'));
      assert.ok(!forRenderer.proxyServerUrl?.includes('user'));
      assert.ok(!forRenderer.proxyServerUrl?.includes('secret'));
    });
  });
});
