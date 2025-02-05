FROM node:23-bullseye

RUN mkdir /.yarn
RUN mkdir /.cache

# Needed to workaround JENKINS-38438
RUN chmod 777 /.yarn
RUN chmod 777 /.cache

RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc
