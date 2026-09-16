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

import {Page} from '@playwright/test';

import {App} from './createApp';

declare global {
  interface Window {
    // Declare the custom variable used to store the intercepted notifications on the window object
    __wireNotifications: Notification[];
    // Declare type of notification repository available globally within the webapps window
    wire?: {app: {repository: {notification: {notifications?: Notification[]}}}};
  }
}

/* Intercept the notifications for each page of the app and store them on the window object for easy access later */
const stubNotifications = async (app: App) => {
  await Promise.all(
    app.windows().map(page =>
      // Browser script to intercept all sent notifications and store them in a global variable for later use
      page.evaluate(() => {
        const notificationRepository = window.wire?.app?.repository?.notification;
        if (notificationRepository?.notifications === undefined) {
          return;
        }

        window.__wireNotifications ??= [];
        let currentNotifications = notificationRepository.notifications;

        Object.defineProperty(notificationRepository, 'notifications', {
          configurable: true,
          get: () => currentNotifications,
          set: nextNotifications => {
            const newNotifications = nextNotifications.slice(currentNotifications.length);
            window.__wireNotifications = window.__wireNotifications.concat(newNotifications);
            currentNotifications = nextNotifications;
          },
        });
      }),
    ),
  );
};

/* Retreive the stored notifications of each of the apps windows and merge them into a single array */
const getNotifications = async (app: App) => {
  return (await Promise.all(app.windows().map(page => getNotificationsOnPage(page)))).flat();
};

// eslint-disable-next-line valid-jsdoc
/**
 * Retrieve the notifications stored in the global variable of the page's window.
 * The function serializes the important properties of the Notification object to pass them to the playwright environment.
 */
const getNotificationsOnPage = async (page: Page) => {
  return await page.evaluate(() => {
    if (window.__wireNotifications === undefined) {
      return [];
    }

    /**
     * It's necessary to construct a new object containing the important properties of the notification
     * since the class would otherwise be serialized as empty object.
     */
    return window.__wireNotifications.map(notification => ({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      icon: notification.icon,
    }));
  });
};

/* Search for a notification matching the given parameters and click it */
const clickNotification = async (app: App, notification: {title?: string; body?: string}) => {
  for (const page of app.windows()) {
    const notifications = await getNotificationsOnPage(page);

    // Find a notification matching the given properties
    const index = notifications.findIndex(
      n =>
        // Ignore the property if it's undefined
        (notification.title !== undefined ? n.title === notification.title : true) &&
        (notification.body !== undefined ? n.body === notification.body : true),
    );

    if (index >= 0) {
      // If found trigger its "onclick" callback
      await page.evaluate(index => window.__wireNotifications.at(index)?.onclick?.(new Event('click')), index);
      return;
    }
  }

  throw new Error(`Can't click notification ${JSON.stringify(notification)} as it doesn't exist`);
};

// eslint-disable-next-line valid-jsdoc
/**
 * Start intercepting the notifications pushed for the given app.
 * @example
 * ```ts
 * const { getNotifications } = await interceptNotifications(app);
 *
 * // Send a notification to one of the accounts logged into the app
 *
 * await expect.poll(() => getNotifications()).toHaveLength(1):
 * ```
 */
export const interceptNotifications = async (app: App) => {
  await stubNotifications(app);

  return {
    /**
     * Async function to get the notifications the intercepted page received so far.
     * Pass this to `expect.poll()` to avoid flake due to timing issues.
     */
    getNotifications: getNotifications.bind(undefined, app),
    /**
     * Search for a notification matching the given parameters and click it
     *
     * Note: This function won't retry automatically, ensure the notification exists before calling it
     */
    clickNotification: clickNotification.bind(undefined, app),
  };
};
