FROM node:23-bullseye

RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc
