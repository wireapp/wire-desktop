#!/usr/bin/env bash

SCRIPT_DIR="${0%/*}"

npx ts-node -P "${SCRIPT_DIR}/../tsconfig.bin.json" "$@"
