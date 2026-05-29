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
