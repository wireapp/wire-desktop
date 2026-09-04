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

export type UnrefableInterval = {
  unref: () => void;
};

export type ScheduleLogCleanupParameters = {
  fireAndForget: (asyncAction: () => Promise<unknown>) => void;
  intervalMilliseconds: number;
  runCleanup: () => Promise<void>;
  setInterval: (callback: () => void, intervalMilliseconds: number) => UnrefableInterval;
};

export function scheduleLogCleanup(parameters: ScheduleLogCleanupParameters): void {
  const cleanupInterval = parameters.setInterval(() => {
    parameters.fireAndForget(parameters.runCleanup);
  }, parameters.intervalMilliseconds);

  cleanupInterval.unref();
}
