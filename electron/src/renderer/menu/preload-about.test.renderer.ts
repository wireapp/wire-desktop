import * as assert from 'assert';
import {IpcMessageEvent, remote} from 'electron';
import {i18nLanguageIdentifier} from '../../interfaces';
import {EVENT_TYPE} from '../../lib/eventType';
import {loadedAboutScreen} from './preload-about';

describe('loadedAboutScreen', () => {
  it('publishes labels', done => {
    remote.ipcMain.on(EVENT_TYPE.ABOUT.LOCALE_VALUES, (event: IpcMessageEvent, labels: i18nLanguageIdentifier[]) => {
      assert.ok(labels);
      done();
    });

    loadedAboutScreen(new Event('test'), {
      copyright: '&copy; Wire Swiss GmbH',
      electronVersion: 'Development',
      productName: 'Wire',
      webappVersion: '2019.04.10.0901',
    });
  });
});
