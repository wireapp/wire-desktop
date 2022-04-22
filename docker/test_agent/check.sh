#!/bin/bash

while true; do
ret=`find /app/ -name "*.deb" | wc -l`
if [[ $ret == "1" ]]; then
    echo -e "[\e[32m*\e[0m] Znaleziono plik deb"
    exit 0
fi

echo -e "[\e[33mOczekiwanie\e[0m]  - nie odnaleziono pliku deb"
sleep 10

done

