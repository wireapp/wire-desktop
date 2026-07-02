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

import {ElectronApplication, Page} from '@playwright/test';

export type App = ElectronApplication & {
  /* The playwright page for the main electron window wrapping the webapp */
  wrapper: Page;
  /* The playwright page for the currently shown webapp */
  page: Page;
};

export type TeamRole = 'admin' | 'partner' | 'owner' | 'member';

export type RegisteredUser = User & {id: string; token: string};

export type TeamOwner = RegisteredUser & {teamId: string};

export type Team = {
  teamId: string;
  owner: TeamOwner;
  /** Add a new member to the team after its initial creation */
  addTeamMember: (member: RegisteredUser, options?: {role?: TeamRole}) => Promise<void>;
};

export type User = {
  firstName: string;
  lastName: string;
  username: string;
  initials: string;
  fullName: string;
  email: string;
  password: string;
};
