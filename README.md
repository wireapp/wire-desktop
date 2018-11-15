# Wire™

![Wire logo](https://github.com/wireapp/wire/blob/master/assets/logo.png?raw=true)

This repository is part of the source code of Wire. You can find more information at [wire.com](https://wire.com) or by contacting opensource@wire.com.

You can find the published source code at [github.com/wireapp/wire](https://github.com/wireapp/wire).

For licensing information, see the attached LICENSE file and the list of third-party licenses at [wire.com/legal/licenses/](https://wire.com/legal/licenses/).

If you compile the open source software that we make available from time to time to develop your own mobile, desktop or web application, and cause that application to connect to our servers for any purposes, we refer to that resulting application as an “Open Source App”. All Open Source Apps are subject to, and may only be used and/or commercialized in accordance with, the Terms of Use applicable to the Wire Application, which can be found at https://wire.com/legal/#terms. Additionally, if you choose to build an Open Source App, certain restrictions apply, as follows:

a. You agree not to change the way the Open Source App connects and interacts with our servers; b. You agree not to weaken any of the security features of the Open Source App; c. You agree not to use our servers to store data for purposes other than the intended and original functionality of the Open Source App; d. You acknowledge that you are solely responsible for any and all updates to your Open Source App.

For clarity, if you compile the open source software that we make available from time to time to develop your own mobile, desktop or web application, and do not cause that application to connect to our servers for any purposes, then that application will not be deemed an Open Source App and the foregoing will not apply to that application.

No license is granted to the Wire trademark and its associated logos, all of which will continue to be owned exclusively by Wire Swiss GmbH. Any use of the Wire trademark and/or its associated logos is expressly prohibited without the express prior written consent of Wire Swiss GmbH.

## Wire Desktop

Cross platform desktop app, wrapping the [wire-webapp](https://github.com/wireapp/wire-webapp). Based on [Electron](http://electron.atom.io).

### Prerequisites

- [Node.js](https://nodejs.org/)
- Git version with submodule functionality
- Python 2.x (to build [spellchecker](https://www.npmjs.com/package/spellchecker))

### Clone

```shell
git clone https://github.com/wireapp/wire-desktop.git
cd wire-desktop
yarn
```

### Start

```shell
yarn start
```

### Test

```shell
yarn test
```

### Tasks

```shell
# Build for macOS
yarn build:macos

# Build for Windows
yarn build:win

# Build for Linux
yarn build:linux
```

### Other Linux targets or architectures

If you would like to build for another Linux target or architecture, run the following command:

```shell
grunt --arch=<arch> --target=<target> linux-other
```

Replace `<arch>` and `<target>` with your desired architecture (e.g. `"ia32"`) and target (e.g. `"rpm"`). Have a look at the [documentation for `electron-builder`](https://github.com/electron-userland/electron-builder/wiki/Options) for the available options. Note that we cannot offer support for uncommon architectures or targets.

### Troubleshooting

If you are having troubles building Wire for Desktop, then [our troubleshooting page](https://github.com/wireapp/wire-desktop/wiki/Troubleshooting) might be of help.

### Translations

All Wire translations are crowdsourced via [Crowdin](https://crowdin.com/projects/wire).
