/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import * as certificateUtils from '@wireapp/certificate-check';
import {app, dialog} from 'electron';
import * as path from 'path';
import {URL} from 'url';
import * as environment from '../js/environment';
import {getText} from '../locale/locale';
import {LogFactory} from '../util/';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
LogFactory.LOG_FILE_PATH = LOG_DIR;
LogFactory.LOG_FILE_NAME = 'electron.log';

const logger = LogFactory.getLogger('CertificateVerifyProcManager.ts', {forceEnable: true});

class CertificateVerifyProcManager {
  private static bypassCertificatePinning: boolean = false;
  private static isDialogLocked: boolean = false;
  private static readonly RESPONSE = {
    RETRY: 0,
    SHOW_CERTIFICATE: 1,
  };

  private static displayCertificatePinningDetails(
    hostname: string,
    certificate: Electron.Certificate,
    isCheckboxChecked: boolean
  ) {
    dialog.showCertificateTrustDialog(
      {
        certificate,
        message: `${getText('certificatePinningShowCertificateMessage')} ${hostname}`,
      },
      () => {
        // Go back to the dialog
        this.displayCertificatePinningError(hostname, certificate, isCheckboxChecked, true);
      }
    );
  }

  public static isCertificatePinningEnabled() {
    return !this.bypassCertificatePinning;
  }

  public static displayCertificatePinningError(
    hostname: string,
    certificate: Electron.Certificate,
    isCheckboxChecked: boolean = false,
    bypassDialogLock: boolean = false
  ) {
    if (this.isDialogLocked && !bypassDialogLock) {
      return;
    }
    this.isDialogLocked = true;

    // todo: attach to main
    dialog.showMessageBox(
      {
        buttons: [getText('certificatePinningRetry'), getText('certificatePinningShowCertificate')],
        checkboxChecked: isCheckboxChecked,
        checkboxLabel: getText('certificatePinningWarningBypass'),
        detail: getText('certificatePinningWarning'),
        message: getText('certificatePinningWarningTitle'),
        type: 'warning',
      },
      (response, checkboxChecked) => {
        switch (response) {
          case this.RESPONSE.RETRY:
            this.bypassCertificatePinning = checkboxChecked;
            if (this.bypassCertificatePinning) {
              logger.log('User disabled certificate pinning');
            }

            this.isDialogLocked = false;
            break;

          case this.RESPONSE.SHOW_CERTIFICATE:
            this.displayCertificatePinningDetails(hostname, certificate, checkboxChecked);
            break;
        }
      }
    );
  }
}

export const setCertificateVerifyProc = (
  request: Electron.CertificateVerifyProcRequest,
  cb: (verificationResult: number) => void
) => {
  const {hostname, certificate, verificationResult} = request;
  const {hostname: hostnameInternal} = new URL(environment.URL_WEBAPP.INTERNAL);

  // Disable TLS verification for development backend
  if (hostname === hostnameInternal && environment.app.IS_DEVELOPMENT) {
    return cb(-3);
  }

  // Check browser results
  if (verificationResult !== 'net::OK') {
    logger.error('Internal Chrome setCertificateVerifyProc failed', hostname, verificationResult);
    return cb(-2);
  }

  // Check certificate pinning
  if (certificateUtils.hostnameShouldBePinned(hostname) && CertificateVerifyProcManager.isCertificatePinningEnabled()) {
    const pinningResults = certificateUtils.verifyPinning(hostname, certificate);

    for (const result of Object.values(pinningResults)) {
      if (result === false) {
        logger.error(
          `Certificate verification failed for "${hostname}":\n${
            pinningResults.errorMessage
          }, showing certificate pinning error dialog.`
        );
        CertificateVerifyProcManager.displayCertificatePinningError(hostname, certificate);
        return cb(-2);
      }
    }
  }

  return cb(-3);
};
