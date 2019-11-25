#!/usr/bin/env bash

if ! command -v otool > /dev/null; then
  echo "Could not find otool. Exiting."
  exit
fi

WIRE_APP_FILE="${1:-"wrap/build/Wire-mas-x64/Wire.app"}"
FRAMEWORK_FILE="${WIRE_APP_FILE}/Contents/Frameworks/Electron Framework.framework/Electron Framework"
PRIVATE_APPLE_APIS="CAContext\|CALayerHost\|NSAccessibilityRemoteUIElement\|NSNextStepFrame\|NSThemeFrame\|NSURLFileTypeMappings"

SEARCH_RESULT="$(otool -ov "${FRAMEWORK_FILE}" | grep -o "${PRIVATE_APPLE_APIS}" | sort -u | uniq)"

if [ "${SEARCH_RESULT}" != "" ]; then
  echo -e "\033[1mWarning\033[0m: The following private Apple APIs were found in \"$(basename "${FRAMEWORK_FILE}")\":"
  echo "${SEARCH_RESULT}"
  echo
  echo -e "\033[1mThis build will most likely not get accepted by Apple.\033[0m"
fi
