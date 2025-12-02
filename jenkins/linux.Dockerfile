FROM node:23-bullseye

# Needed to workaround JENKINS-38438
RUN mkdir /.yarn
RUN mkdir /.cache
RUN mkdir /.gnupg
RUN chmod 777 /.yarn
RUN chmod 777 /.cache
RUN chmod 777 /.gnupg

RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc
