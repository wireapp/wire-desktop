#!/usr/bin/env bash

set -eu -o pipefail

SCRIPT_NAME="${0##*/}"
SCRIPT_DIR="${0%/*}"

BINARY_DIR="./debian/pool/main"
STABLE_DIR="./debian/dists/stable"
CACHE_DIR="./cache"
CONF_DIR="${SCRIPT_DIR}/conf"

APT_CONF_FILE="${CONF_DIR}/apt-ftparchive.conf"
RELEASE_FILE="${STABLE_DIR}/Release"
STABLE_CONF_FILE="${CONF_DIR}/stable.conf"

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

_error() {
  echo >&2 "${SCRIPT_NAME}: Error: ${1}"
}

mkdir -p "${BINARY_DIR}" "${STABLE_DIR}/main/binary-"{all,i386,amd64} "${CONF_DIR}" "${CACHE_DIR}"

if _command_exist "gpg2"; then
  GPG_VERSION="$(gpg2 --version | head -n 1 | grep -oE '2\..*')"
  if ! grep -qE "2\.0" <<< "${GPG_VERSION}"; then
    _error "Your gpg2 version is ${GPG_VERSION}. Signing with a predefined passphrase will work only with gpg2 version 2.0.x."
    exit 1
  fi
else
  _error "Could not find gpg2. Please install package 'gnupg2' version 2.0.x."
  exit 1
fi

if ! _command_exist "apt-ftparchive"; then
  _error "Could not find apt-ftparchive. Please install package 'apt-utils'."
  exit 1
fi

if ! ls ./*.deb > /dev/null 2>&1; then
  _error "No binaries found. Add some in ${PWD}."
  exit 1
fi

for FILE in *.deb; do
  cp "${FILE}" "${BINARY_DIR}"
done

if [ ! -r "${APT_CONF_FILE}" ]; then
  _error "Could not read ${APT_CONF_FILE}. Create it in ${CONF_DIR}."
  exit 1
fi

if [ ! -r "${STABLE_CONF_FILE}" ]; then
  _error "Could not read ${STABLE_CONF_FILE}. Create it in ${CONF_DIR}."
  exit 1
fi

# Check if private key file exists
if [ ! -r "${PGP_KEYFILE}" ]; then
  _error "PGP key file '${PGP_KEYFILE}' missing. Please add it to ${PWD}."
  exit 1
fi

if [ -z "${PGP_PASSPHRASE}" ]; then
  _error "You need to set PGP_PASSPHRASE in order to sign the release file."
  exit 1
fi

_log "Reading config file..."
apt-ftparchive generate "${APT_CONF_FILE}"

_log "Generating release files..."
apt-ftparchive -c "${STABLE_CONF_FILE}" release "${STABLE_DIR}" > "${RELEASE_FILE}"

_log "Signing release files..."
mkdir -p "${GPG_TEMP_DIR}"
chmod 700 "${GPG_TEMP_DIR}"

gpg2 --batch \
     --homedir "${GPG_TEMP_DIR}" \
     --import "${PGP_KEYFILE}"

echo "${PGP_PASSPHRASE}" | \
gpg2 --armor \
     --batch \
     --detach-sign \
     --homedir "${GPG_TEMP_DIR}" \
     --local-user "${PGP_SIGN_ID}" \
     --no-tty \
     --output "${RELEASE_FILE}.gpg" \
     --passphrase-fd 0 \
     --quiet \
     --yes \
     "${RELEASE_FILE}"

rm -rf "${GPG_TEMP_DIR}"

echo "Done"
