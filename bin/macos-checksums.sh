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

SCRIPT_NAME="${0##*/}"

GPG_TEMP_DIR=".gpg-temporary"
GPG_TEMP_KEYS_DIR="${GPG_TEMP_DIR}/private-keys-v1.d"
PGP_SIGN_ID="D599C1AA126762B1"
PGP_KEYFILE="${PGP_PRIVATE_KEY_FILE:-${PGP_SIGN_ID}.asc}"
PGP_PASSPHRASE="${PGP_PASSPHRASE:-""}"
BUILD_VERSION="${1}"

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

if ! _command_exist "gpg"; then
  _error_exit "Could not find gpg. Please install package 'gnupg2' version 2.1.x."
fi

if ! _command_exist "shasum"; then
  _error_exit "Could not find sha256sum. Please install package 'coreutils'."
fi

if ! ls ./*.pkg > /dev/null 2>&1; then
  _error_exit "No pkg files found. Add some in ${PWD}."
fi

_log "Creating checksums..."
shasum -a 256 *.pkg > sha256sum.txt

_log "Creating source code archive for signing..."
git archive -o "${BUILD_VERSION}.tar.gz" --format tar.gz --prefix "wire-desktop-release-${BUILD_VERSION}/" master

_log "Preparing gpg configuration..."
mkdir -p "${GPG_TEMP_KEYS_DIR}"
chmod 700 "${GPG_TEMP_DIR}"

gpg --batch \
    --homedir "${GPG_TEMP_DIR}" \
    --quiet \
    --import "${PGP_KEYFILE}"

_log "Updating gpg2 configuration to sign on unattended machines..."
echo "allow-loopback-pinentry" > "${HOME}/.gnupg/gpg-agent.conf"
killall gpg-agent

_log "Signing checksum file with PGP key..."

echo "${PGP_PASSPHRASE}" | \
gpg --batch \
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
gpg --batch \
    --clearsign \
    --homedir "${GPG_TEMP_DIR}" \
    --local-user "${PGP_SIGN_ID}" \
    --no-tty \
    --output "${BUILD_VERSION}.tar.gz.sig" \
    --pinentry-mode loopback \
    --passphrase-fd 0 \
    --quiet \
    --yes \
    "${BUILD_VERSION}.tar.gz"

rm "${BUILD_VERSION}.tar.gz"

_log "Info: Deleting temp files in a secure way."
find "${GPG_TEMP_DIR}" -type f -exec rm -P {} \;

rm -rf "${GPG_TEMP_DIR}"

_log "Done"
