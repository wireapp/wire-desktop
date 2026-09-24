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

import {BrowserWindow, dialog, Session, webContents} from 'electron';

import {getText} from '../locale';
import {getLogger} from '../logging/getLogger';

const logger = getLogger('WebAuthn');
const registeredSessions = new WeakSet<Session>();

export function registerWebAuthnAccountPicker(session: Session): void {
  if (registeredSessions.has(session)) {
    return;
  }
  registeredSessions.add(session);
  logger.info('[Passkeys] Account picker registered for an authentication-capable session.');

  session.on('select-webauthn-account', async (_event, details, callback) => {
    let credentialId: string | undefined;
    let outcome = 'cancelled: dialog failed';
    try {
      const {frame, accounts, relyingPartyId} = details;
      logger.info(`[Passkeys] Account-selection request received; available accounts: ${accounts.length}.`);
      if (!frame || frame.detached || accounts.length === 0) {
        outcome = 'cancelled: no active requesting frame or no accounts';
        return;
      }
      const contents = webContents.fromFrame(frame);
      if (!contents || contents.isDestroyed()) {
        outcome = 'cancelled: requesting web contents no longer exist';
        return;
      }
      const parent = BrowserWindow.fromWebContents(contents);
      if (!parent || parent.isDestroyed()) {
        outcome = 'cancelled: requesting window no longer exists';
        return;
      }
      const requestUrl = frame.url;
      const cancelId = accounts.length;
      logger.info('[Passkeys] Showing account picker.');
      const {response} = await dialog.showMessageBox(parent, {
        type: 'question',
        title: 'Sign in with a passkey',
        message: `Choose an account for ${relyingPartyId}`,
        buttons: [
          ...accounts.map(
            (account, index) =>
              [account.displayName, account.name].filter(Boolean).join(' — ') || `Account ${index + 1}`,
          ),
          getText('promptCancel'),
        ],
        cancelId,
        defaultId: cancelId,
        noLink: true,
      });
      outcome = 'cancelled: requesting page closed or navigated';
      if (!contents.isDestroyed() && !frame.detached && frame.url === requestUrl) {
        credentialId = accounts[response]?.credentialId;
        outcome = credentialId
          ? 'account selected; returning choice to authenticator (login result not yet known)'
          : 'cancelled: picker dismissed or no valid selection';
      }
    } catch {
      logger.error('[Passkeys] Account picker failed; cancelling request.');
    } finally {
      logger.info(`[Passkeys] ${outcome}.`);
      callback(credentialId);
    }
  });
}
