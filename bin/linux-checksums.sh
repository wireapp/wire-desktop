#!/usr/bin/env bash

#
# Wire
# Copyright (C) 2018 Wire Swiss GmbH
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see http://www.gnu.org/licenses/.
#

set -eu -o pipefail

BUILD_VERSION="${1:-"0"}"

SCRIPT_NAME="${0##*/}"

GPG_TEMP_DIR=".gpg-temporary"
GPG_TEMP_KEYS_DIR="${GPG_TEMP_DIR}/private-keys-v1.d"
PGP_SIGN_ID="D599C1AA126762B1"
PGP_KEYFILE="${PGP_PRIVATE_KEY_FILE:-${PGP_SIGN_ID}.asc}"
PGP_PASSPHRASE="${PGP_PASSPHRASE:-""}"
SHRED_STATUS="available"

_command_exist() {
  command -v "${1}" > /dev/null
}

_log() {
  echo "${SCRIPT_NAME}: ${1}"
}

_error_exit() {
  echo >&2 "${SCRIPT_NAME}: Error: ${1}"
  exit 1
}

if ! _command_exist "gpg2"; then
  _error_exit "Could not find gpg2. Please install package 'gnupg2' version 2.1.x."
fi

if ! _command_exist "sha256sum"; then
  _error_exit "Could not find sha256sum. Please install package 'coreutils'."
fi

if ! _command_exist "shred"; then
  _log "Could not find shred. Please install package 'coreutils'."
  SHRED_STATUS="unavailable"
fi

if ! ls ./*.deb > /dev/null 2>&1; then
  _error_exit "No deb files found. Add some in ${PWD}."
fi

if ! ls ./*.rpm > /dev/null 2>&1; then
  _error_exit "No rpm files found. Add some in ${PWD}."
fi

if ! ls ./*.AppImage > /dev/null 2>&1; then
  _error_exit "No AppImage files found. Add some in ${PWD}."
fi

_log "Creating checksums..."
sha256sum *.deb *.rpm *.AppImage > sha256sum.txt

_log "Creating source code archive for signing..."
(
  cd ../../
  git archive -o "wrap/dist/${BUILD_VERSION}.tar.gz" --format tar.gz --prefix "wire-desktop-release-${BUILD_VERSION}/" master
)

_log "Preparing gpg configuration..."
mkdir -p "${GPG_TEMP_KEYS_DIR}"
chmod 700 "${GPG_TEMP_DIR}"

gpg2 --batch \
     --homedir "${GPG_TEMP_DIR}" \
     --quiet \
     --import "${PGP_KEYFILE}"

_log "Updating gpg2 configuration to sign on unattended machines..."

echo "allow-loopback-pinentry" > "${HOME}/.gnupg/gpg-agent.conf"
killall gpg-agent

_log "Signing checksum file with PGP key..."

echo "${PGP_PASSPHRASE}" | \
gpg2 --batch \
     --clearsign \
     --homedir "${GPG_TEMP_DIR}" \
     --local-user "${PGP_SIGN_ID}" \
     --no-tty \
     --output "sha256sum.txt.asc" \
     --pinentry-mode loopback \
     --passphrase-fd 0 \
     --quiet \
     --yes \
     "sha256sum.txt"

_log "Signing source code archive with PGP key..."

echo "${PGP_PASSPHRASE}" | \
gpg2 --batch \
     --detach-sign \
     --homedir "${GPG_TEMP_DIR}" \
     --local-user "${PGP_SIGN_ID}" \
     --no-tty \
     --pinentry-mode loopback \
     --passphrase-fd 0 \
     --quiet \
     --yes \
     "${BUILD_VERSION}.tar.gz"

rm "${BUILD_VERSION}.tar.gz"

if [ "${SHRED_STATUS}" == "unavailable" ]; then
  _log "Info: shred not found. Using insecure way of deleting."
else
  find "${GPG_TEMP_DIR}" -type f -exec shred {} \;
fi

rm -rf "${GPG_TEMP_DIR}"

_log "Done"
