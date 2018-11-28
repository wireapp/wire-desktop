#!/usr/bin/env bash

set -eu -o pipefail

SCRIPT_NAME="${0##*/}"
SCRIPT_DIR="${0%/*}"

TEMP_DIR="$(mktemp -d)"
GPG_TEMP_DIR="${TEMP_DIR}/.gpg-temporary"
GPG_TEMP_DIR2="${GPG_TEMP_DIR}/private-keys-v1.d"
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

if ! _command_exist "gpg"; then
  _error_exit "Could not find gpg. Please install package 'gnupg2' version 2.1.x."
fi

if ! _command_exist "shasum"; then
  _error_exit "Could not find sha256sum. Please install package 'coreutils'."
fi

if ! ls ./*.pkg > /dev/null 2>&1; then
  _error_exit "No pkg files found. Add some in ${PWD}."
fi

_log "Create checksums..."
shasum -a 256 *.pkg > sha256sum.txt

_log "Prepare gpg configuration..."
mkdir -p "${GPG_TEMP_DIR2}"
chmod 700 "${GPG_TEMP_DIR}"

gpg --batch \
     --homedir "${GPG_TEMP_DIR}" \
     --quiet \
     --import "${PGP_KEYFILE}"

_log "Update gpg2 configuration to sign on unattended machines..."
echo "allow-loopback-pinentry" > ~/.gnupg/gpg-agent.conf
killall gpg-agent

_log "Sign checksum file with gpg key..."

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

_log "Info: Deleting temp files in a secure way."
find "${GPG_TEMP_DIR}" -type f -exec rm -P {} \;

rm -rf "${TEMP_DIR}"

_log "Done"
