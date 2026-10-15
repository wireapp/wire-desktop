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

import {faker} from '@faker-js/faker';
import axios, {AxiosInstance} from 'axios';

import {TeamOwner} from './PublicApiClient';

export type IbisApiClientConfig = {
  baseUrl: string;
};

// eslint-disable-next-line valid-jsdoc
/* A manually written api client for the ibis api proxied over nginz, it is used to unlock enterprise features on staging */
export class IbisApiClient {
  private readonly axiosInstance: AxiosInstance;

  constructor({baseUrl}: IbisApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  upgradeTeam = async (teamOwner: TeamOwner) => {
    const billingInfo = {
      firstname: teamOwner.firstName,
      lastname: teamOwner.lastName,
      company: faker.company.name(),
      street: '123 Test Street',
      zip: '12345',
      city: 'Berlin',
      country: 'DE',
    };

    for (let i = 0; i < 5; i++) {
      const res = await this.axiosInstance.put(`/teams/${teamOwner.teamId}/billing/info`, billingInfo, {
        headers: {Authorization: `Bearer ${teamOwner.token}`},
        validateStatus: _status => true, // Since we want the request to be retried we need to prevent axios from throwing automatically
      });
      if (res.status !== 412) {
        break;
      }

      if (i === 4) {
        throw new Error(`Failed to set billing information for team with id ${teamOwner.teamId}`);
      }

      // eslint-disable-next-line no-console
      console.log(
        `Failed to upgrade team with id ${teamOwner.teamId}, retrying in ${1 * (i + 1)} seconds...`,
        res.data,
      );
      await new Promise(res => setTimeout(res, 1_000 * (i + 1)));
    }

    await this.axiosInstance.put(
      `/teams/${teamOwner.teamId}/billing/card`,
      {
        // tok_visa is a pre-built test token provided by Stripe for test mode environments.
        // It represents the card number 4242424242424242 (Visa, always succeeds) without needing to go through the Stripe.js card tokenization flow.
        stripeToken: 'tok_visa',
      },
      {headers: {Authorization: `Bearer ${teamOwner.token}`}},
    );

    const plansResponse = await this.axiosInstance.get(`teams/${teamOwner.teamId}/billing/plan/list`, {
      headers: {Authorization: `Bearer ${teamOwner.token}`},
    });
    if (!Array.isArray(plansResponse.data) || plansResponse.data.length < 1) {
      throw new Error('No valid enterprise plans found to upgrade to');
    }

    const plan = plansResponse.data.find(plan => plan.premium === true);

    await this.axiosInstance.put(
      `/teams/${teamOwner.teamId}/billing/subscription`,
      {planId: plan.id},
      {headers: {Authorization: `Bearer ${teamOwner.token}`}},
    );

    const {data: upgradedTeam} = await this.axiosInstance.get(`teams/${teamOwner.teamId}/billing/team`, {
      headers: {Authorization: `Bearer ${teamOwner.token}`},
    });
    if (upgradedTeam.status !== 'active') {
      throw new Error('Failed to upgrade team');
    }
  };
}
