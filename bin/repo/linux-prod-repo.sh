#!/usr/bin/env bash

set -e

# Change to script's directory to ensure we're in the correct folder.
# http://stackoverflow.com/questions/3349105/how-to-set-current-working-directory-to-the-directory-of-the-script
cd "${0%/*}"

_command_exist() {
  command -v "${1}" > /dev/null
}

BINARY_DIR="./debian/pool/main"
STABLE_DIR="./debian/dists/stable"
CACHE_DIR="./cache"
CONF_DIR="./conf"

APT_CONF_FILE="${CONF_DIR}/apt-ftparchive.conf"
RELEASE_FILE="${STABLE_DIR}/Release"
STABLE_CONF_FILE="${CONF_DIR}/stable.conf"

PGP_SIGN_ID="D599C1AA126762B1"
PGP_PASSPHRASE=""

mkdir -p {"${BINARY_DIR}","${STABLE_DIR}/main/binary-"{all,i386,amd64},"${CONF_DIR}","${CACHE_DIR}"}

if ! _command_exist "gpg"; then
  echo "Could not find gpg. Please install package 'gnupg2'."
  exit 1
fi

if ! _command_exist "apt-ftparchive"; then
  echo "Could not find apt-ftparchive. Please install package 'apt-utils'."
  exit 1
fi

if [ -z "$(ls -A ${BINARY_DIR})" ]; then
  echo "No binaries found. Add some in ${BINARY_DIR}."
  exit 1
fi

if [ ! -r "${APT_CONF_FILE}" ]; then
  echo "Could not read ${APT_CONF_FILE}. Create it in ${CONF_DIR}."
  exit 1
fi

if [ ! -r "${STABLE_CONF_FILE}" ]; then
  echo "Could not read ${STABLE_CONF_FILE}. Create it in ${CONF_DIR}."
  exit 1
fi

if ! gpg --list-secret-keys "${PGP_SIGN_ID}" > /dev/null; then
  echo "Your gpg-agent does not have the PGP Key with ID ${PGP_SIGN_ID} stored. Please try importing it first."
  exit 1
fi

echo "Reading config file..."
apt-ftparchive generate "${APT_CONF_FILE}"

echo "Generating release files..."
apt-ftparchive -c "${STABLE_CONF_FILE}" release "${STABLE_DIR}" > "${RELEASE_FILE}"

echo "Signing release files..."
gpg --passphrase "${PGP_PASSPHRASE}" --yes -u "${PGP_SIGN_ID}" -o "${RELEASE_FILE}.gpg" -ba "${RELEASE_FILE}"

echo "Done"
