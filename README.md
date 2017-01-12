# Wire™

![Wire logo](https://github.com/wireapp/wire/blob/master/assets/logo.png?raw=true)

This repository is part of the source code of Wire. You can find more information at [wire.com](https://wire.com) or by contacting opensource@wire.com.

You can find the published source code at [github.com/wireapp/wire](https://github.com/wireapp/wire).

For licensing information, see the attached LICENSE file and the list of third-party licenses at [wire.com/legal/licenses/](https://wire.com/legal/licenses/).

If you compile the open source software that we make available from time to time to develop your own mobile, desktop or web application, and cause that application to connect to our servers for any purposes, we refer to that resulting application as an “Open Source App”.  All Open Source Apps are subject to, and may only be used and/or commercialized in accordance with, the Terms of Use applicable to the Wire Application, which can be found at https://wire.com/legal/#terms.  Additionally, if you choose to build an Open Source App, certain restrictions apply, as follows:

a. You agree not to change the way the Open Source App connects and interacts with our servers; b. You agree not to weaken any of the security features of the Open Source App; c. You agree not to use our servers to store data for purposes other than the intended and original functionality of the Open Source App; d. You acknowledge that you are solely responsible for any and all updates to your Open Source App.

For clarity, if you compile the open source software that we make available from time to time to develop your own mobile, desktop or web application, and do not cause that application to connect to our servers for any purposes, then that application will not be deemed an Open Source App and the foregoing will not apply to that application.

No license is granted to the Wire trademark and its associated logos, all of which will continue to be owned exclusively by Wire Swiss GmbH. Any use of the Wire trademark and/or its associated logos is expressly prohibited without the express prior written consent of Wire Swiss GmbH.

## Wire Desktop

Cross platform desktop app, wrapping the [wire-webapp](https://github.com/wireapp/wire-webapp).
Based on [Electron](http://electron.atom.io).

### Install

1. Install [Node.js](https://nodejs.org/)
2. Install [Yarn](https://yarnpkg.com) (`npm install -g yarn`)
3. Install [Grunt](https://gruntjs.com) (`npm install -g grunt-cli`)

### Clone

```shell
git clone https://github.com/wireapp/wire-desktop.git
cd wire-desktop
```

### Compile

```shell
yarn
```

### Start for debugging/developing

```shell
yarn start
```

### Test

```
yarn test
```

### Package

```shell
# Build for macOS
grunt macos-prod

# Build for Windows
grunt win-prod

# Build for Windows 32-bit on a 64-bit system
export npm_config_target_arch=ia32
npm install
grunt win-prod

# Build for Linux 32-bit
export npm_config_target_arch=ia32
npm install
grunt linux-prod-32

# Build for Linux 64-bit
export npm_config_target_arch=x64
npm install
grunt linux-prod-64
```
