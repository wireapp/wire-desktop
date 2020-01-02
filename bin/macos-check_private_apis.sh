#!/usr/bin/env bash

if ! command -v otool > /dev/null; then
  echo "Could not find otool. Exiting."
  exit
fi

WIRE_APP_FILE="${1:-"wrap/build/Wire-mas-x64/Wire.app"}"
FRAMEWORK_FILE="${WIRE_APP_FILE}/Contents/Frameworks/Electron Framework.framework/Electron Framework"
PRIVATE_APPLE_APIS="CAContext\|CALayerHost\|NSAccessibilityRemoteUIElement\|NSNextStepFrame\|NSThemeFrame\|NSURLFileTypeMappings"

SEARCH_RESULT="$(otool -ov "${FRAMEWORK_FILE}" | grep -o "${PRIVATE_APPLE_APIS}" | sort -u | uniq | sed 's/^/- /g')"

if [ "${SEARCH_RESULT}" != "" ]; then
  echo -e "**Warning**: The following private Apple APIs were found in \"$(basename "${FRAMEWORK_FILE}")\":"
  echo "${SEARCH_RESULT}"
  echo
  echo -e "This build will most likely not get accepted by Apple."
else
  echo "No private Apple APIs found."
fi
