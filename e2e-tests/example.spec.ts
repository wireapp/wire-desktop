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

import {test, expect, _electron as electron} from '@playwright/test';

test('starts the app', async () => {
  const app = await electron.launch({
    args: ['.', '--env=https://wire-webapp-dev.zinfra.io'],
    locale: 'en', // ToDo: The locale isn't respected by the mounted webview
  });

  // Wait for main window to be opened and the embedded webview to be loaded
  const window = await app.firstWindow();
  await window.waitForLoadState('networkidle');

  /**
   * The webview element isn't treated as a regular webcomponent / iframe by electron but as individual window.
   * So in order to access the contents of the application we need to use the second window.
   */
  const webview = app.windows()[1];

  await expect(webview.getByText('Wire')).toBeVisible();

  await app.close();
});
