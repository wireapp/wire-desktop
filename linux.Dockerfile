FROM node:8.11.4-stretch

RUN set -ex; \
	apt-get update; \
        apt-get install -y --no-install-recommends python python-pip

