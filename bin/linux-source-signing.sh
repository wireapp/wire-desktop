#!/usr/bin/env bash

#
# Wire
# Copyright (C) 2019 Wire Swiss GmbH
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

set -e -o pipefail

SCRIPT_NAME="${0##*/}"
RELEASE_VERSION="${1}"
GPG_TEMP_DIR="$(mktemp -d)"
GPG_TEMP_KEYS_DIR="${GPG_TEMP_DIR}/private-keys-v1.d"
PGP_SIGN_ID="D599C1AA126762B1"
PGP_KEYFILE="${PGP_PRIVATE_KEY_FILE:-${PGP_SIGN_ID}.asc}"
PGP_PASSPHRASE="${PGP_PASSPHRASE:-""}"
RELEASE_DOWNLOAD="https://github.com/wireapp/wire-desktop/archive/linux/${RELEASE_VERSION}.tar.gz"

_command_exist() {
  command -v "${1}" > /dev/null
}

_log() {
  echo "${SCRIPT_NAME}: ${1}"
}

_error_exit() {
  printf >&2 "${SCRIPT_NAME}: Error: ${1}\n"
  exit 1
}

if [ -z "${1}" ]; then
  _error_exit "No release version specified.\nUsage: ${SCRIPT_NAME} <version>"
fi

if ! _command_exist "gpg2"; then
  _error_exit "Could not find gpg2. Please install package 'gnupg2' version 2.1.x."
fi

_log "Downloading release ${RELEASE_VERSION} from GitHub ..."

if _command_exist "curl"; then
  curl -fsLO "${RELEASE_DOWNLOAD}"
else
  wget -q "${RELEASE_DOWNLOAD}"
fi

_log "Preparing gpg configuration..."
mkdir -p "${GPG_TEMP_KEYS_DIR}"
chmod 700 "${GPG_TEMP_DIR}"

gpg2 --batch \
     --homedir "${GPG_TEMP_DIR}" \
     --quiet \
     --import "${PGP_KEYFILE}"

_log "Updating gpg2 configuration to sign on unattended machines..."

echo "allow-loopback-pinentry" > "${HOME}/.gnupg/gpg-agent.conf"
#killall gpg-agent

_log "Signing source code archive with PGP key..."

echo "${PGP_PASSPHRASE}" | \
gpg2 --batch \
     --homedir "${GPG_TEMP_DIR}" \
     --no-tty \
     --pinentry-mode loopback \
     --passphrase-fd 0 \
     --detach-sign \
     --local-user "${PGP_SIGN_ID}" \
     --output "${RELEASE_VERSION}.tar.gz.sig" \
     --quiet \
     --yes \
     "${RELEASE_VERSION}.tar.gz"

_log "Verify signature..."

gpg2 --verify \
     --homedir "${GPG_TEMP_DIR}" \
     "${RELEASE_VERSION}.tar.gz.sig" "${RELEASE_VERSION}.tar.gz"

rm "${RELEASE_VERSION}.tar.gz"

_log "Done"
