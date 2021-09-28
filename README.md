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

Cross-platform desktop app, wrapping the [wire-webapp](https://github.com/wireapp/wire-webapp). Based on [Electron](https://electronjs.org).

### Prerequisites

- [Node.js](https://nodejs.org/) >= 10
- Git

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

### Development Workflow

| Stage | Action | Target Branch | Target Version |
| :-- | :-- | :-- | :-- |
| 1 (Feature development) | commit | your-feature-branch | x.y+3 (e.g. 3.20) |
| 2 (Nightly test automation) | commit or squash merge from feature branch | [dev](https://github.com/wireapp/wire-desktop/tree/dev) | x.y+2 (e.g. 3.19) |
| 3 (Internal release) | merge (don't squash) from [dev](https://github.com/wireapp/wire-desktop/tree/dev) | [staging](https://github.com/wireapp/wire-desktop/tree/staging) | x.y+1 (e.g. 3.18) |
| 4 (Production release) | merge (don't squash) from [staging](https://github.com/wireapp/wire-desktop/tree/staging) | [main](https://github.com/wireapp/wire-desktop/tree/main) | x.y (e.g. 3.17) |

**Compare Views**

1. Updates from "dev" to "staging" (changelog): https://github.com/wireapp/wire-desktop/compare/staging...dev
1. Updates from "staging" to "main" (changelog): https://github.com/wireapp/wire-desktop/compare/main...staging

### Creating executables & installers

Several steps are required to create an installable and fully executable Wire desktop app:

1. Code (TypeScript, JavaScript, CSS) has to be compiled
2. Compiled code and resources (taskbar icons, app images, etc.) have to be bundled
3. An installer for the bundle has to be created
4. The installer has to be signed (only for production releases)

The preceding steps are implemented with the following scripts (using Windows as a showcase):

1. `yarn build:prepare`
2. `yarn build:win`
3. `build:win:installer:internal` (for internal versions) or `build:win:installer` (for production versions, includes step 4)
4. `build:win:installer`

All artifacts (executables & installers) will be written to the "wrap" directory from the root of this repository. There are tasks for specific platforms (e.g. `yarn build:macos` or `yarn build:win`).

#### Linux targets

If you would like to build for a custom Linux target, run the following command:

```shell
export LINUX_TARGET=<target>
yarn build:linux
```

Replace `<target>` with your desired target (e.g. `rpm`). Have a look at the [documentation for `electron-builder`](https://www.electron.build/configuration/linux) for the available targets. Multiple targets can be combined by comma separation (e.g. `rpm,deb`). Note that we cannot offer support for uncommon targets.

Furthermore, you can disable [asar packaging](https://electronjs.org/docs/tutorial/application-packaging) (not recommended, but e.g. needed for target `dir`) by setting `ENABLE_ASAR="false"` before building. Example:

```shell
export ENABLE_ASAR="false"
yarn build:linux
```

### Releases

To release a desktop version it needs a build and a deployment. There are Jenkins jobs to create builds (e.g. [Windows Build Pipeline](https://10.10.124.17/view/Windows/)) and a job to do [Deployments](https://10.10.124.17/view/Deploy/job/Deploy_Wrapper/) (can trigger internal and/or production rollouts). These Jenkins jobs can only be accessed from Wire's VPN. You also have to log-in with your "Jenkins User ID" in order to start the build and/or deployment pipeline. You will find more information [here](https://wearezeta.atlassian.net/wiki/spaces/WEB/pages/106628739/).

### Troubleshooting

If you are having troubles building Wire for Desktop, then [our troubleshooting page](https://github.com/wireapp/wire-desktop/wiki/Troubleshooting) might be of help.

### Translations

All Wire translations are crowdsourced via [Crowdin](https://crowdin.com/projects/wire).
