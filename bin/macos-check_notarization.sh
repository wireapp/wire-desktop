#!/usr/bin/env bash

if ! command -v stapler > /dev/null; then
  echo "Could not find otool. Exiting."
  exit
fi

WIRE_PKG_FILE="wrap/dist/Wire.pkg"
WIRE_APP_FILE="wrap/build/Wire-mas-x64/Wire.app"

STAPLER_PKG_RESULT="$(stapler validate "${WIRE_PKG_FILE}" 2>&1)"
SPCTL_PKG_RESULT="$(spctl -a -vvv -t install "${WIRE_PKG_FILE}" 2>&1)"
STAPLER_APP_RESULT="$(stapler validate "${WIRE_APP_FILE}" 2>&1)"
SPCTL_APP_RESULT="$(spctl -a -vvv -t install "${WIRE_APP_FILE}" 2>&1)"

echo "Stapler .pkg notarization result:"
echo "${STAPLER_PKG_RESULT}"
echo
echo "spctl .pkg notarization result:"
echo "${SPCTL_PKG_RESULT}"
echo
echo "Stapler .app notarization result:"
echo "${STAPLER_APP_RESULT}"
echo
echo "spctl .app notarization result:"
echo "${SPCTL_APP_RESULT}"
