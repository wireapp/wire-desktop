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

interface DisplayCertificateErrorOptions {
  bypassDialogLock: boolean;
  isChromiumError: boolean;
  isCheckboxChecked: boolean;
}

class CertificateVerifyProcManager {
  private static bypassCertificatePinning: boolean = false;
  private static isDialogLocked: boolean = false;

  public static readonly CHROMIUM_ERRORS = {
    CERT_AUTHORITY_INVALID: -202,
    CERT_COMMON_NAME_INVALID: -200,
  };
  private static readonly RESPONSE = {
    RETRY: 0,
    SHOW_DETAILS: 1,
  };

  private static displayCertificateDetails(
    hostname: string,
    certificate: Electron.Certificate,
    options: DisplayCertificateErrorOptions
  ) {
    dialog.showCertificateTrustDialog(
      {
        certificate,
        message: `${
          options.isChromiumError
            ? getText('certificateVerifyProcManagerShowDetailsTextChromium')
            : getText('certificateVerifyProcManagerShowDetailsTextPinning')
        } ${hostname}`,
      },
      () => {
        // Go back to the dialog
        this.displayCertificateError(hostname, certificate, {
          ...options,
          bypassDialogLock: true,
        });
      }
    );
  }

  public static isCertificatePinningEnabled() {
    return !this.bypassCertificatePinning;
  }
  public static displayCertificateChromiumError(hostname: string, certificate: Electron.Certificate) {
    this.displayCertificateError(hostname, certificate, {isChromiumError: true});
  }

  public static displayCertificateError(
    hostname: string,
    certificate: Electron.Certificate,
    options?: Partial<DisplayCertificateErrorOptions>
  ) {
    const {bypassDialogLock, isChromiumError, isCheckboxChecked} = {
      bypassDialogLock: false,
      isCheckboxChecked: false,
      isChromiumError: false,
      ...options,
    };
    if (this.isDialogLocked && !bypassDialogLock) {
      return;
    }
    this.isDialogLocked = true;

    dialog.showMessageBox(
      {
        buttons: [getText('certificateVerifyProcManagerRetry'), getText('certificateVerifyProcManagerShowDetails')],
        checkboxChecked: isChromiumError ? undefined : isCheckboxChecked,
        checkboxLabel: isChromiumError ? undefined : getText('certificateVerifyProcManagerWarningBypass'),
        detail: isChromiumError
          ? getText('certificateVerifyProcManagerWarningTextChromium')
          : getText('certificateVerifyProcManagerWarningTextPinning'),
        message: getText('certificateVerifyProcManagerWarningTitle'),
        type: 'warning',
      },
      (response: number, checkboxChecked: boolean) => {
        switch (response) {
          case this.RESPONSE.RETRY:
            if (!isChromiumError) {
              this.bypassCertificatePinning = checkboxChecked;
              if (this.bypassCertificatePinning) {
                logger.log('User disabled certificate pinning');
              }
            }

            this.isDialogLocked = false;
            break;

          case this.RESPONSE.SHOW_DETAILS:
            this.displayCertificateDetails(hostname, certificate, {
              bypassDialogLock,
              isCheckboxChecked: checkboxChecked,
              isChromiumError,
            });
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
  const {hostname, certificate, verificationResult, errorCode} = request;
  const {hostname: hostnameInternal} = new URL(environment.URL_WEBAPP.INTERNAL);

  // Disable TLS verification for development backend
  if (hostname === hostnameInternal && environment.app.IS_DEVELOPMENT) {
    return cb(-3);
  }
  CertificateVerifyProcManager.displayCertificateChromiumError(hostname, certificate);

  // Check browser results
  if (verificationResult !== 'net::OK') {
    logger.error(
      `Internal Chrome TLS verification failed. Hostname: ${hostname}. Verification result: ${verificationResult}. Error code: ${errorCode}`
    );

    const isCommonCertificateError =
      errorCode === CertificateVerifyProcManager.CHROMIUM_ERRORS.CERT_COMMON_NAME_INVALID ||
      errorCode === CertificateVerifyProcManager.CHROMIUM_ERRORS.CERT_AUTHORITY_INVALID;
    if (isCommonCertificateError) {
      CertificateVerifyProcManager.displayCertificateChromiumError(hostname, certificate);
    }

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
        CertificateVerifyProcManager.displayCertificateError(hostname, certificate);
        return cb(-2);
      }
    }
  }

  return cb(-3);
};
