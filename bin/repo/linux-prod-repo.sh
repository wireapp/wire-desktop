#!/usr/bin/env bash

set -eu -o pipefail

BINARY_DIR="./debian/pool/main"
STABLE_DIR="./debian/dists/stable"
CACHE_DIR="./cache"
CONF_DIR="../../bin/repo/conf"

APT_CONF_FILE="${CONF_DIR}/apt-ftparchive.conf"
RELEASE_FILE="${STABLE_DIR}/Release"
STABLE_CONF_FILE="${CONF_DIR}/stable.conf"

PGP_SIGN_ID="D599C1AA126762B1"
PGP_KEYFILE="${PGP_PRIVATE_KEY_FILE:-${PGP_SIGN_ID}.asc}"
GPG_TEMP_DIR=".gpg-temporary"

_command_exist() {
  command -v "${1}" > /dev/null
}

mkdir -p "${BINARY_DIR}" "${STABLE_DIR}/main/binary-"{all,i386,amd64} "${CONF_DIR}" "${CACHE_DIR}"

if ! _command_exist "gpg"; then
  echo >&2 "Could not find gpg. Please install package 'gnupg2'."
  exit 1
fi

if ! _command_exist "apt-ftparchive"; then
  echo >&2 "Could not find apt-ftparchive. Please install package 'apt-utils'."
  exit 1
fi

# Check if .deb files exist in this folder
if ! ls *.deb > /dev/null 2>&1; then
  echo >&2 "No binaries found. Add some in ${PWD}."
  exit 1
fi

for FILE in *.deb; do
  cp "${FILE}" "${BINARY_DIR}"
done

if [ ! -r "${APT_CONF_FILE}" ]; then
  echo >&2 "Could not read ${APT_CONF_FILE}. Create it in ${CONF_DIR}."
  exit 1
fi

if [ ! -r "${STABLE_CONF_FILE}" ]; then
  echo >&2 "Could not read ${STABLE_CONF_FILE}. Create it in ${CONF_DIR}."
  exit 1
fi

# Check if private key file exists
if [ ! -r "${PGP_KEYFILE}" ]; then
  echo >&2 "PGP Key file '${PGP_KEYFILE}' missing. Please add it to ${PWD}."
  exit 1
fi

if [ -z "${GPG_PASSPHRASE}" ]; then
  echo >&2 "You need to set GPG_PASSPHRASE in order to sign the Release file."
  exit 1
fi

echo "Reading config file..."
apt-ftparchive generate "${APT_CONF_FILE}"

echo "Generating release files..."
apt-ftparchive -c "${STABLE_CONF_FILE}" release "${STABLE_DIR}" > "${RELEASE_FILE}"

echo "Signing release files..."
mkdir -p "${GPG_TEMP_DIR}"
chmod 700 "${GPG_TEMP_DIR}"

gpg2 --batch \
    --homedir "${GPG_TEMP_DIR}" \
    --import "${PGP_KEYFILE}"

echo "${GPG_PASSPHRASE}" | \
gpg2 --passphrase-fd 0 \
    --homedir "${GPG_TEMP_DIR}" \
    --no-tty \
    --batch \
    --armor \
    --yes \
    --local-user "${PGP_SIGN_ID}" \
    --detach-sign \
    --output "${RELEASE_FILE}.gpg" \
    "${RELEASE_FILE}"

rm -rf "${GPG_TEMP_DIR}"

echo "Done"
