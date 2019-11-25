#!/usr/bin/env bash

FRAMEWORK_FILE="wrap/build/WireInternal-mas-x64/WireInternal.app/Contents/Frameworks/Electron Framework.framework/Electron Framework"
PRIVATE_APPLE_APIS="CAContext\|CALayerHost\|NSAccessibilityRemoteUIElement\|NSNextStepFrame\|NSThemeFrame\|NSURLFileTypeMappings"
RESULT="$(otool -ov "${FRAMEWORK_FILE}" | grep -o "${PRIVATE_APPLE_APIS}" | sort -u | uniq)"

if [ "${RESULT}" != "" ]; then
  echo -e "\033[1mWarning\033[0m: The following private Apple APIs were found in \"$(basename "${FRAMEWORK_FILE}")\":"
  echo "${RESULT}"
  echo
  echo -e "\033[1mThis build will most likely not get accepted by Apple.\033[0m"
fi
