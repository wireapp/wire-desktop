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
 *
 */

import {ipcRenderer} from 'electron';
import {spy} from 'sinon';

import * as assert from 'assert';

import {loadedAboutScreen} from './preload-about';

import {EVENT_TYPE} from '../../lib/eventType';

describe('loadedAboutScreen', () => {
  // eslint-disable-next-line jest/no-done-callback
  it('publishes labels', done => {
    const sendSpy = spy(ipcRenderer, 'send');

    loadedAboutScreen(null, {
      copyright: '&copy; Wire Swiss GmbH',
      electronVersion: 'Development',
      productName: 'Wire',
      webappVersion: '2019.04.10.0901',
      webappAVSVersion: '9.0.test',
    });

    assert.ok(sendSpy.calledOnceWith(EVENT_TYPE.ABOUT.LOCALE_VALUES, []));
    done();
  });
});
