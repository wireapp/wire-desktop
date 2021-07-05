#!/usr/bin/env bash

if ! command -v stapler > /dev/null; then
  echo "Could not find otool. Exiting."
  exit
fi

WIRE_PKG_FILE="${1:-"wrap/dist/Wire.pkg"}"

STAPLER_RESULT="$(stapler validate "${WIRE_PKG_FILE}" 2>&1)"
SPCTL_RESULT="$(spctl -a -vvv -t install "${WIRE_PKG_FILE}" 2>&1)"

echo "Stapler notarization result:"
echo "${STAPLER_RESULT}"
echo
echo "spctl notarization result:"
echo "${SPCTL_RESULT}"
