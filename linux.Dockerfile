FROM node:8.11.4-stretch

RUN set -ex; \
	apt-get update; \
        apt-get install -y --no-install-recommends alien python python-pip python-setuptools python-wheel g++-multilib

