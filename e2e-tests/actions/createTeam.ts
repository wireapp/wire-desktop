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

import {createUser, registerUser} from './createUser';

import {BrigApiClient} from '../backend/BrigApiClient';
import {PublicApiClient, RegisteredUser} from '../backend/PublicApiClient';

export type Team = {
  teamId: string;
  owner: RegisteredUser;
  /** Add a new member to the team after its initial creation */
  addTeamMember: (member: RegisteredUser, options?: {role?: keyof typeof Role}) => Promise<void>;
};

export enum Role {
  ADMIN = 'admin',
  EXTERNAL = 'partner',
  MEMBER = 'member',
  OWNER = 'owner',
}

export const createTeam = async (
  api: {publicApi: PublicApiClient; brigApi: BrigApiClient},
  teamName: string,
  options?: {
    users?: (RegisteredUser | {user: RegisteredUser; role?: keyof typeof Role})[];
    features?: {
      conferenceCalling?: boolean;
      channels?: boolean;
      mls?: boolean;
      cells?: boolean;
    };
  },
) => {
  const user = createUser();
  const owner = await registerUser(user, {publicApi: api.publicApi, brigApi: api.brigApi});

  const {teamId} = await api.publicApi.upgradeUserToTeamOwner(owner, teamName);
  owner.teamId = teamId;

  const addTeamMember: Team['addTeamMember'] = async (member, options) => {
    const invitationId = await api.publicApi.sendTeamInvitation(member.email, owner, Role[options?.role ?? 'MEMBER']);
    const invitationCode = await api.brigApi.getTeamActivationCode(owner.teamId, invitationId);
    await api.publicApi.acceptTeamInvitation(invitationCode, member);
  };

  if (options?.users) {
    await Promise.all(
      options.users.map(user => {
        if ('user' in user) {
          return addTeamMember(user.user, {role: user.role});
        }
        return addTeamMember(user);
      }),
    );
  }

  if (options?.features && Object.values(options.features).some(Boolean)) {
    // The team will be reset right after initialization, so we need to wait a short time for it to finish
    // before changing feature configs since they would otherwise be overwritten (See WPB-23698)
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (options.features.conferenceCalling) {
      await api.brigApi.unlockConferenceCallingFeature(teamId);
    }
  }

  return {teamId, owner, addTeamMember};
};
