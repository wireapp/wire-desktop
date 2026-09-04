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

import assert from 'node:assert';

import {getWindowsMsiWebAppConfiguration, selectWebAppUrlOverride, WindowsRegistry} from './WindowsMsiConfiguration';

function registryWith(values: Array<{name: string; data: unknown}>): WindowsRegistry {
  return {
    HKEY: {HKEY_LOCAL_MACHINE: 'HKLM'},
    enumerateValues: (_hive, subkey) => {
      assert.strictEqual(subkey, 'SOFTWARE\\Wire\\Wire');
      return values;
    },
  };
}

describe('WindowsMsiConfiguration', () => {
  describe('getWindowsMsiWebAppConfiguration', () => {
    it('reads and normalizes an HTTPS webapp URL from the product registry key', () => {
      const configuration = getWindowsMsiWebAppConfiguration(
        'Wire',
        registryWith([{name: 'WebAppUrl', data: ' https://wire.example.test/client '}]),
      );

      assert.deepStrictEqual(configuration, {isConfigured: true, url: 'https://wire.example.test/client'});
    });

    it('treats a missing or empty value as unconfigured', () => {
      assert.deepStrictEqual(getWindowsMsiWebAppConfiguration('Wire', registryWith([])), {isConfigured: false});
      assert.deepStrictEqual(
        getWindowsMsiWebAppConfiguration('Wire', registryWith([{name: 'WebAppUrl', data: '  '}])),
        {isConfigured: false},
      );
    });

    it('fails closed for an unsafe or malformed configured URL', () => {
      for (const value of ['http://wire.example.test', 'https://user:password@wire.example.test', 'not a URL']) {
        assert.deepStrictEqual(
          getWindowsMsiWebAppConfiguration('Wire', registryWith([{name: 'WebAppUrl', data: value}])),
          {isConfigured: true, issue: 'invalid-url'},
        );
      }
    });
  });

  describe('selectWebAppUrlOverride', () => {
    it('gives valid machine configuration precedence over command-line and per-user settings', () => {
      assert.strictEqual(
        selectWebAppUrlOverride(
          {isConfigured: true, url: 'https://managed.example.test/'},
          'https://command.example.test',
          'https://user.example.test',
        ),
        'https://managed.example.test/',
      );
    });

    it('does not fall back when machine configuration is present but invalid', () => {
      assert.strictEqual(
        selectWebAppUrlOverride({isConfigured: true}, 'https://command.example.test', 'https://user.example.test'),
        undefined,
      );
    });

    it('preserves command-line and per-user precedence when no machine configuration exists', () => {
      assert.strictEqual(
        selectWebAppUrlOverride({isConfigured: false}, 'https://command.example.test', 'https://user.example.test'),
        'https://command.example.test',
      );
      assert.strictEqual(
        selectWebAppUrlOverride({isConfigured: false}, undefined, 'https://user.example.test'),
        'https://user.example.test',
      );
    });
  });
});
