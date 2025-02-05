FROM node:23-bullseye

RUN mkdir /.yarn

# Needed to workaround JENKINS-38438
RUN chown -R 1016:1016 /.yarn 

RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc
