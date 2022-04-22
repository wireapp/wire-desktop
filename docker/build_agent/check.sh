#!/bin/bash

ret=`find /app/ -name "*.deb" | wc -l`
if [[ $ret == "1" ]]; then
    exit 0
fi

exit 1
