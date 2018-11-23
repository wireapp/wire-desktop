FROM node:8.13.0-stretch

ENV USE_HARD_LINKS false

RUN set -ex; \
	apt-get update; \
        apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc python python-pip python-setuptools python-wheel

RUN curl -sLS https://yarnpkg.com/install.sh | bash
