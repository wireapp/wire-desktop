# Windows MSI distribution

Wire's native MSI is intended for managed, per-machine Windows deployments. It installs the existing packaged Electron application under `Program Files`; it does not wrap or invoke the legacy Squirrel `Setup.exe`.

## Build

Build the Windows application before building its MSI:

```shell
yarn build:win
yarn build:win:msi -m
```

`-m` disables electron-builder's automatic signing. Jenkins uses this mode because it signs the packaged Windows executables before creating the MSI, and signs the resulting MSI separately with the managed signing service.

The standard Wire environments have permanent MSI upgrade codes in `build-windows-msi.ts`. Never change an upgrade code after its first release. A custom-branded build must set `WIN_MSI_UPGRADE_CODE` to its own permanent UUID so that it cannot collide with a standard Wire installation.

The Squirrel installer remains available as a separate build target during migration. MSI artifacts are published under `win/msi/<environment>` and must never replace the `RELEASES` metadata used by existing Squirrel installations.

Before promoting the first MSI release, update the download-page consumer and the external `Wrapper_Windows_Smoke_Tests` Jenkins job to select and install the versioned `.msi` artifact instead of `Wire-Setup.exe`.

## Updates

MSI installations are updated by deploying a newer signed MSI with the same upgrade code and a higher product version. The application only starts the Squirrel updater when a sibling Squirrel `Update.exe` is present, so an MSI installation does not perform application-managed updates.

For unattended deployment, use standard Windows Installer commands and retain a verbose log:

```powershell
msiexec.exe /i Wire-<version>-x64.msi /qn /norestart /l*v Wire-install.log
msiexec.exe /x Wire-<version>-x64.msi /qn /norestart /l*v Wire-uninstall.log
```

The endpoint-management policy should close Wire before an upgrade. A deployment must handle Windows Installer exit codes, including reboot-required results, rather than treating every non-zero result as a generic failure.

## Migration from Squirrel

Squirrel installs Wire per user under `%LocalAppData%`; the MSI installs it per machine under `Program Files`. Windows Installer cannot safely remove Squirrel installations from every user profile. Deployments must therefore remove the old Squirrel installation in each affected user context before assigning the MSI. Otherwise both installations can coexist and compete for shortcuts, auto-launch, and the `wire://` protocol.

Do not delete the Squirrel update feed while supported Squirrel installations remain in use.

## Release acceptance

A release candidate is acceptable only after it has been exercised on a supported Windows version and satisfies all of the following:

- The MSI and every packaged executable pass `signtool.exe verify /pa`.
- Interactive and `/qn` installation succeed for a standard managed user with elevation supplied by the deployment system.
- Wire is installed under `Program Files` and appears exactly once in Apps & Features with the correct publisher, version, and icon.
- Start Menu and desktop shortcuts launch Wire and carry the configured application user model ID.
- The configured custom URL protocol launches the installed executable.
- A higher version upgrades in place, leaves one Apps & Features entry, and preserves user data.
- A lower version is rejected and same-version repair does not create a second installation.
- Upgrade behaviour while Wire is running is understood and documented for the deployment policy.
- Silent uninstall removes MSI-owned files, shortcuts, and protocol registration while preserving user data.
- An MSI-installed application neither schedules Squirrel updates nor reports a missing `Update.exe`.
- Production, Internal, Wire-Gov, and custom products do not share upgrade codes.
- The managed Squirrel-to-MSI removal and installation sequence has been tested on a representative existing profile.
