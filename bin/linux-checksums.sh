#!/usr/bin/env bash

set -eu -o pipefail

SCRIPT_NAME="${0##*/}"
SCRIPT_DIR="${0%/*}"

GPG_TEMP_DIR=".gpg-temporary"
PGP_SIGN_ID="D599C1AA126762B1"
PGP_KEYFILE="${PGP_PRIVATE_KEY_FILE:-${PGP_SIGN_ID}.asc}"
PGP_PASSPHRASE="${PGP_PASSPHRASE:-""}"

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
else
  SHRED_STATUS="available"
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

_log "Create checksums..."
sha256sum *.deb *.rpm *.AppImage > sha256sum.txt

_log "Prepare gpg configuration..."
mkdir -p "${GPG_TEMP_DIR}"
chmod 700 "${GPG_TEMP_DIR}"

gpg2 --batch \
     --homedir "${GPG_TEMP_DIR}" \
     --quiet \
     --import "${PGP_KEYFILE}"

_log "Update gpg2 configuration to sign on unattended machines..."
echo "allow-loopback-pinentry" > ~/.gnupg/gpg-agent.conf
killall gpg-agent

_log "Sign checksum file with gpg key..."

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

if [ "${SHRED_STATUS}" == "unavailable" ]; then
  _log "Info: shred not found. Using insecure way of deleting."
else
  find "${GPG_TEMP_DIR}" -type f -exec shred {} \;
fi

rm -rf "${GPG_TEMP_DIR}"

_log "Done"
