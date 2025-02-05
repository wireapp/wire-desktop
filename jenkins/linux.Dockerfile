FROM node:23-bullseye

# Needed to workaround JENKINS-38438
RUN chown -R 1016:1016 /home/node 

RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends alien apt-utils g++-multilib gnupg2 psmisc
