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
PGP_SIGN_ID="D599C1AA126762B1"
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
  curl -sLO "${RELEASE_DOWNLOAD}"
else
  wget -q "${RELEASE_DOWNLOAD}"
fi

_log "Signing source code archive with PGP key..."

gpg2 --batch \
     --detach-sign \
     --local-user "${PGP_SIGN_ID}" \
     --output "${RELEASE_VERSION}.tar.gz.sig" \
     --quiet \
     --yes \
     "${RELEASE_VERSION}.tar.gz"

gpg2 --verify \
     "${RELEASE_VERSION}.tar.gz.sig" "${RELEASE_VERSION}.tar.gz"

rm "${RELEASE_VERSION}.tar.gz"

_log "Done"
