#!/usr/bin/env bash

if ! command -v spctl > /dev/null; then
  echo "Could not find spctl. Exiting."
  exit
fi

WIRE_APP_FILE="${1:-"wrap/build/Wire-mas-x64/Wire.app"}"

SPCTL_RESULT="$(spctl -a -vvv -t install "${WIRE_APP_FILE}" 2>&1)"

if [[ "${SPCTL_RESULT}" =~ .*"accepted".* ]]; then
  echo -e "👍 The build was correctly notarized:"
else
  echo -e "⚠️ **Warning**: The build was not correctly notarized:"
fi

echo "${SPCTL_RESULT}"
