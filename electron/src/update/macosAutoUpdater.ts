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

import {BrowserWindow, dialog} from 'electron';
import {autoUpdater} from 'electron-updater';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger('MacAutoUpdater');
const isInternalBuild = (): boolean => config.environment === 'internal';

export function initMacAutoUpdater(mainWindow: BrowserWindow): void {
  // Skip in dev
  if (process.env.NODE_ENV === 'development') {
    logger.log('Skipping auto-update in development');
    return;
  }

  // Only run for internal builds (production = App Store -> handled by Apple)
  if (!isInternalBuild()) {
    logger.log('Skipping auto-update: not an internal build');
    return;
  }

  logger.log('Initializing macOS auto-updater for internal build');

  // INTERNAL FEED URL (served from S3)
  // We upload latest-mac.yml + WireInternal-<version>.zip here.
  const feedUrl =
    process.env.WIRE_INTERNAL_MAC_UPDATE_URL || 'https://wire-taco.s3.eu-west-1.amazonaws.com/mac/internal/updates/';

  // TODO (infra): once internal mac auto-update is validated using the raw S3 URL,
  // expose it via https://wire-app.wire.com/mac/internal/updates/ (similar to WIN_URL_UPDATE).
  // const feedUrl =
  //   process.env.WIRE_INTERNAL_MAC_UPDATE_URL ||
  //   'https://wire-app.wire.com/mac/internal/updates/';

  logger.log(`Using update feed: ${feedUrl}`);

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: feedUrl,
  });

  autoUpdater.on('checking-for-update', () => {
    logger.log('Checking for update…');
  });

  autoUpdater.on('update-available', info => {
    logger.log(`Update available: ${info.version}`);
  });

  autoUpdater.on('update-not-available', info => {
    logger.log(`No update available (current: ${info.version})`);
  });

  autoUpdater.on('error', err => {
    logger.error('Auto-updater error', err);
  });

  autoUpdater.on('download-progress', progress => {
    // For now we only log; no progress UI.
    logger.log(
      `Update download progress: ${progress.percent?.toFixed?.(1) ?? 'n/a'}% at ${progress.bytesPerSecond} B/s`,
    );
  });

  autoUpdater.on('update-downloaded', async info => {
    logger.log(`Update downloaded: ${info.version}`);

    // Show a simple native dialog when the update is ready.
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Install & Restart', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Wire Update Ready',
      message: 'A new version of Wire is ready to install.',
      detail: `Version ${info.version} has been downloaded. Wire will restart to complete the update.`,
    });

    if (result.response === 0) {
      logger.log('User chose to install update now');
      autoUpdater.quitAndInstall();
    } else {
      logger.log('User chose to install later');
    }
  });

  // Kick off background check + download.
  autoUpdater.checkForUpdates();
}
