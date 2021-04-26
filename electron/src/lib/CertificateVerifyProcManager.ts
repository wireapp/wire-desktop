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
import {BrowserWindow, Certificate, Request as CertificateVerifyRequest, dialog} from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';

import {getText} from '../locale/locale';
import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

const logger = getLogger(path.basename(__filename));

interface DisplayCertificateErrorOptions {
  bypassDialogLock: boolean;
  isCheckboxChecked: boolean;
  isChromiumError: boolean;
}

enum CertificateVerificationResult {
  /** Indicates success and disables Certificate Transparency verification */
  SUCCESS = 0,
  FAILURE = -2,
  USE_CHROMIUM_VALIDATION = -3,
}

enum CHROMIUM_ERRORS {
  CERT_AUTHORITY_INVALID = -202,
  CERT_COMMON_NAME_INVALID = -200,
}

enum RESPONSE {
  GO_BACK = 0,
  RETRY = 0,
  SAVE_CERTIFICATE = 1,
  SHOW_DETAILS = 1,
}

class CertificateVerifyProcManager {
  private static bypassCertificatePinning = false;
  private static isDialogLocked = false;
  public static mainWindow: BrowserWindow;

  private static readonly dialogUnlockTimeout = 6000;

  private static readonly LOCALE = {
    RETRY: getText('certificateVerifyProcManagerRetry'),
    SHOW_DETAILS: getText('certificateVerifyProcManagerShowDetails'),
    SHOW_DETAILS_GO_BACK: getText('certificateVerifyProcManagerShowDetailsGoBack'),
    SHOW_DETAILS_SAVE_CERTIFICATE: getText('certificateVerifyProcManagerShowDetailsSaveCertificate'),
    SHOW_DETAILS_TEXT_CHROMIUM: getText('certificateVerifyProcManagerShowDetailsTextChromium'),
    SHOW_DETAILS_TEXT_PINNING: getText('certificateVerifyProcManagerShowDetailsTextPinning'),
    SHOW_DETAILS_TITLE: getText('certificateVerifyProcManagerShowDetailsTitle'),
    WARNING_BYPASS: getText('certificateVerifyProcManagerWarningBypass'),
    WARNING_TEXT_CHROMIUM: getText('certificateVerifyProcManagerWarningTextChromium'),
    WARNING_TEXT_PINNING: getText('certificateVerifyProcManagerWarningTextPinning'),
    WARNING_TITLE: getText('certificateVerifyProcManagerWarningTitle'),
  };

  private static async displayCertificateDetails(
    hostname: string,
    certificate: Certificate,
    options: DisplayCertificateErrorOptions,
  ): Promise<void> {
    const goBack = async (): Promise<void> => {
      // Go back to the dialog
      await this.displayCertificateError(hostname, certificate, {
        ...options,
        bypassDialogLock: true,
      });
    };

    const textDetails = `${
      options.isChromiumError ? this.LOCALE.SHOW_DETAILS_TEXT_CHROMIUM : this.LOCALE.SHOW_DETAILS_TEXT_PINNING
    } ${hostname}`;

    const isTrustDialogSupported = EnvironmentUtil.platform.IS_MAC_OS;
    if (isTrustDialogSupported) {
      await dialog.showCertificateTrustDialog(this.mainWindow, {
        certificate,
        message: textDetails,
      });
      await goBack();
    } else {
      // For Linux and Windows, use a message box with the ability to save the certificate
      const {response} = await dialog.showMessageBox(this.mainWindow, {
        buttons: [this.LOCALE.SHOW_DETAILS_GO_BACK, this.LOCALE.SHOW_DETAILS_SAVE_CERTIFICATE],
        cancelId: RESPONSE.GO_BACK,
        detail: textDetails,
        message: this.LOCALE.SHOW_DETAILS_TITLE,
        type: 'info',
      });
      switch (response) {
        case RESPONSE.SAVE_CERTIFICATE: {
          const {filePath: chosenPath} = await dialog.showSaveDialog(this.mainWindow, {
            defaultPath: `${hostname}.pem`,
          });
          if (chosenPath !== undefined) {
            await fs.writeFile(chosenPath, Buffer.from(certificate.data));
          }
          // Go back on details window
          await this.displayCertificateDetails(hostname, certificate, options);
          break;
        }
        case RESPONSE.GO_BACK: {
          await goBack();
          break;
        }
      }
    }
  }

  public static isCertificatePinningEnabled(): boolean {
    return !this.bypassCertificatePinning;
  }

  public static async displayCertificateChromiumError(hostname: string, certificate: Certificate): Promise<void> {
    await this.displayCertificateError(hostname, certificate, {isChromiumError: true});
  }

  public static async displayCertificateError(
    hostname: string,
    certificate: Certificate,
    options?: Partial<DisplayCertificateErrorOptions>,
  ): Promise<void> {
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

    const {checkboxChecked, response} = await dialog.showMessageBox(this.mainWindow, {
      buttons: [this.LOCALE.RETRY, this.LOCALE.SHOW_DETAILS],
      cancelId: RESPONSE.RETRY,
      checkboxChecked: isChromiumError ? undefined : isCheckboxChecked,
      checkboxLabel: isChromiumError ? undefined : this.LOCALE.WARNING_BYPASS,
      defaultId: RESPONSE.RETRY,
      detail: isChromiumError ? this.LOCALE.WARNING_TEXT_CHROMIUM : this.LOCALE.WARNING_TEXT_PINNING,
      message: this.LOCALE.WARNING_TITLE,
      type: 'warning',
    });
    switch (response) {
      case RESPONSE.RETRY: {
        if (!isChromiumError) {
          this.bypassCertificatePinning = checkboxChecked;
          if (this.bypassCertificatePinning) {
            logger.log('User disabled certificate pinning');
          }
        }

        // Postpone unlocking of the dialog so the user have time to leave the app
        setTimeout(() => (this.isDialogLocked = false), this.dialogUnlockTimeout);
        break;
      }

      case RESPONSE.SHOW_DETAILS: {
        await this.displayCertificateDetails(hostname, certificate, {
          bypassDialogLock,
          isCheckboxChecked: checkboxChecked,
          isChromiumError,
        });
        break;
      }
    }
  }
}

export const attachTo = (main: BrowserWindow): void => {
  CertificateVerifyProcManager.mainWindow = main;
};

export const setCertificateVerifyProc = async (
  request: CertificateVerifyRequest,
  cb: (verificationResult: number) => void,
): Promise<void> => {
  const {hostname, validatedCertificate, verificationResult, errorCode} = request;
  // Check browser results
  if (verificationResult !== 'net::OK') {
    logger.error(
      `Internal Chrome TLS verification failed. Hostname: ${hostname}. Verification result: ${verificationResult}. Error code: ${errorCode}`,
    );

    const isCommonCertificateError =
      errorCode === CHROMIUM_ERRORS.CERT_COMMON_NAME_INVALID || errorCode === CHROMIUM_ERRORS.CERT_AUTHORITY_INVALID;
    if (isCommonCertificateError) {
      await CertificateVerifyProcManager.displayCertificateChromiumError(hostname, validatedCertificate);
    }

    return cb(CertificateVerificationResult.FAILURE);
  }

  // Check certificate pinning
  if (certificateUtils.hostnameShouldBePinned(hostname) && CertificateVerifyProcManager.isCertificatePinningEnabled()) {
    const pinningResults = certificateUtils.verifyPinning(hostname, validatedCertificate);
    const falsyValue = Object.values(pinningResults).some(val => val === false);

    if (falsyValue || pinningResults.errorMessage) {
      logger.error(`Certificate verification failed for "${hostname}".`);
      logger.error(`Error: "${pinningResults.errorMessage}". Displaying certificate pinning error dialog.`);
      await CertificateVerifyProcManager.displayCertificateError(hostname, validatedCertificate);
      return cb(CertificateVerificationResult.FAILURE);
    }
  }

  return cb(CertificateVerificationResult.USE_CHROMIUM_VALIDATION);
};
