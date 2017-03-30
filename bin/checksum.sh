#!/bin/bash

set -e 
cd wrap/dist
if [ -e SHA256SUMS ]; then rm SHA256SUMS; fi
find \( -name "*.deb" -o -name "*.AppImage" \) -exec sha256sum {} \; >> SHA256SUMS
