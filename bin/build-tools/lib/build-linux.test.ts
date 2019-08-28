/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
 */

import * as assert from 'assert';
import * as path from 'path';
import uuid from 'uuid/v4';

import {buildLinuxConfig} from './build-linux';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');

describe('build-linux', () => {
  describe('buildLinuxConfig', () => {
    it('honors environment variables', () => {
      const categories = uuid();
      const keywords = uuid();
      const nameShort = uuid();
      const targets = [uuid(), uuid()];

      process.env.LINUX_CATEGORIES = categories;
      process.env.LINUX_KEYWORDS = keywords;
      process.env.LINUX_NAME_SHORT = nameShort;
      process.env.LINUX_TARGET = targets.join(',');

      const {linuxConfig} = buildLinuxConfig(wireJsonPath, envFilePath);

      assert.strictEqual(linuxConfig.categories, categories);
      assert.strictEqual(linuxConfig.executableName, nameShort);
      assert.strictEqual(linuxConfig.keywords, keywords);
      assert.deepStrictEqual(linuxConfig.targets, targets);

      delete process.env.LINUX_CATEGORIES;
      delete process.env.LINUX_NAME_SHORT;
      delete process.env.LINUX_KEYWORDS;
      delete process.env.LINUX_TARGET;
    });
  });
});
