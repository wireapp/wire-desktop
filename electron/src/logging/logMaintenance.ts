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

export type LogMaintenanceCoordinator = {
  runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result>;
  runWrite<Result>(operation: () => Promise<Result>): Promise<Result>;
};

export type CreateLogMaintenanceCoordinatorDependencies = {
  fireAndForget: (asyncAction: () => Promise<unknown>) => void;
};

type QueuedMaintenance = {
  operation: () => Promise<void>;
};

type QueuedWrite = () => void;

export function createLogMaintenanceCoordinator(
  dependencies: CreateLogMaintenanceCoordinatorDependencies,
): LogMaintenanceCoordinator {
  let activeWriteCount = 0;
  let maintenanceRequested = false;
  let maintenanceRunning = false;
  let queuedMaintenances: QueuedMaintenance[] = [];
  let queuedWrites: QueuedWrite[] = [];

  function startQueuedWrites(): void {
    const writesToStart = queuedWrites;
    queuedWrites = [];

    for (const startWrite of writesToStart) {
      startWrite();
    }
  }

  function finishMaintenance(): void {
    maintenanceRunning = false;

    if (queuedMaintenances.length > 0) {
      dependencies.fireAndForget(startNextMaintenance);

      return;
    }

    maintenanceRequested = false;
    startQueuedWrites();
  }

  function releaseWrite(): void {
    activeWriteCount -= 1;
    dependencies.fireAndForget(startNextMaintenance);
  }

  async function startWrite<Result>(
    operation: () => Promise<Result>,
    resolve: (result: Result) => void,
    reject: (error: unknown) => void,
  ): Promise<void> {
    activeWriteCount += 1;

    try {
      const result = await operation();

      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      releaseWrite();
    }
  }

  async function startNextMaintenance(): Promise<void> {
    if (maintenanceRunning || activeWriteCount !== 0 || queuedMaintenances.length === 0) {
      return;
    }

    maintenanceRunning = true;
    const nextMaintenance = queuedMaintenances[0];
    queuedMaintenances = queuedMaintenances.toSpliced(0, 1);

    try {
      await nextMaintenance.operation();
    } catch {
      // The queued operation rejects the public maintenance promise itself.
    } finally {
      finishMaintenance();
    }
  }

  function runWrite<Result>(operation: () => Promise<Result>): Promise<Result> {
    return new Promise<Result>((resolve, reject) => {
      const startCurrentWrite = (): void => {
        dependencies.fireAndForget(() => startWrite(operation, resolve, reject));
      };

      if (maintenanceRequested === false && maintenanceRunning === false) {
        startCurrentWrite();

        return;
      }

      queuedWrites = [...queuedWrites, startCurrentWrite];
    });
  }

  function runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result> {
    return new Promise<Result>((resolve, reject) => {
      const queuedOperation = async (): Promise<void> => {
        try {
          const result = await operation();

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      maintenanceRequested = true;
      queuedMaintenances = [...queuedMaintenances, {operation: queuedOperation}];
      dependencies.fireAndForget(startNextMaintenance);
    });
  }

  return {runMaintenance, runWrite};
}
