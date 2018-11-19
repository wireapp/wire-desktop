FROM node:8.12.0-stretch

ENV USE_HARD_LINKS false

RUN curl -sLS https://yarnpkg.com/install.sh | bash

RUN set -ex; \
	apt-get update; \
        apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc python python-pip python-setuptools python-wheel

