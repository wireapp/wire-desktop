FROM node:lts

COPY check.sh check.sh
WORKDIR /app

CMD apt-get update; apt-get upgrade -y; apt-get install -y rpm; \
    git config http.sslVerify false; \ 
    cd /app; \
    export LINUX_TARGET=deb; \
    git clone https://github.com/wireapp/wire-desktop.git; \
    cd ./wire-desktop; \
    yarn; \
    yarn build:linux;



