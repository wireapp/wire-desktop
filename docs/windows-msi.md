# Windows MSI distribution

Wire's native MSI is intended for managed, per-machine Windows 10 and later deployments. It installs the existing packaged Electron application under `Program Files`; it does not wrap or invoke the legacy Squirrel `Setup.exe`.

## Build

Build the Windows application before building its MSI:

```shell
yarn build:win
yarn build:win:msi -m
```

The Windows Jenkins job uses `yarn build:win:installers` to create the Squirrel and MSI artifacts together without cleaning `wrap/dist` between them. The individual installer commands continue to clean their output for local builds.

`-m` disables electron-builder's automatic signing. Jenkins uses this mode because it signs the packaged Windows executables before creating the MSI, and signs the resulting MSI separately with the managed signing service.

The Windows 10 minimum-version check reads `CurrentBuildNumber` from the 64-bit Windows registry. Do not replace it with Windows Installer's built-in version properties, which can report compatibility values on modern Windows.

Interactive installation uses the standard assisted Windows Installer flow with a Wire-branded banner, including welcome, installation location, readiness, progress, and completion pages. The managed deployment defaults create both desktop and Start Menu shortcuts; they are not optional features in the installer UI.

The standard Wire environments have permanent MSI upgrade codes in `build-windows-msi.ts`. Never change an upgrade code after its first release. A custom-branded build must set `WIN_MSI_UPGRADE_CODE` to its own permanent GUID so that it cannot collide with a standard Wire installation. The MSI manufacturer defaults to `Wire Swiss GmbH`; an OEM build can override it with `WIN_MSI_MANUFACTURER`.

The production job builds and archives both installer families during migration. Squirrel artifacts remain published under `win/<environment>` and MSI artifacts are published separately under `win/msi/<environment>`; an MSI must never replace the `RELEASES` metadata used by existing Squirrel installations.

Before promoting the first MSI release, add MSI selection and installation coverage to the download-page consumer and the external Windows smoke tests without removing the existing Squirrel release coverage.

## Updates

MSI installations are updated by deploying a newer signed MSI with the same upgrade code and a higher product version. The application only starts the Squirrel updater when a sibling Squirrel `Update.exe` is present, so an MSI installation does not perform application-managed updates.

For unattended deployment, use standard Windows Installer commands and retain a verbose log:

```powershell
msiexec.exe /i Wire-<version>-x64.msi /qn /norestart /l*v Wire-install.log
msiexec.exe /x Wire-<version>-x64.msi /qn /norestart /l*v Wire-uninstall.log
```

An organization can set the web application endpoint while installing or upgrading the MSI:

```powershell
msiexec.exe /i Wire-<version>-x64.msi WIRE_WEBAPP_URL="https://wire.example.com" /qn /norestart
```

`WIRE_WEBAPP_URL` is a secure public Windows Installer property. The MSI stores it machine-wide as `WebAppUrl` under `HKLM\Software\Wire\<product name>`, retains it when a later MSI is deployed without the property, and removes the MSI-owned value on uninstall. Supply a new value to change the endpoint during an upgrade, or `WIRE_CLEAR_WEBAPP_URL=1` to return to the application's normal environment selection.

Only credential-free HTTPS URLs are accepted. The machine-wide value takes precedence over `--env` and per-user `init.json`; an invalid managed value fails closed instead of silently connecting to a different environment. Windows Installer logs public properties, so the configured URL must not contain credentials or other secrets.

The endpoint-management policy should close Wire before an upgrade. A deployment must handle Windows Installer exit codes, including reboot-required results, rather than treating every non-zero result as a generic failure.

## MDM deployment contract

Assign the MSI to devices and install it in the local SYSTEM context. It is a per-machine package (`ALLUSERS=1`) and does not require an interactive user session; the assisted wizard is skipped when `/qn` is used.

Use the endpoint-management system's MSI inventory for detection. A release has a version-specific product code, while the upgrade code remains stable for the product family. A custom detection rule should therefore check the installed product identity and version, not the MSI filename alone.

Treat Windows Installer success and reboot-required results according to the endpoint-management system's conventions. In particular, `0` is success, while `1641` and `3010` indicate successful installation with a reboot initiated or required. Retain the verbose MSI log when diagnosing a failed deployment.

Before broad deployment, validate fresh install, upgrade, repair, and uninstall while running as SYSTEM on every supported Windows version. The MSI and all packaged executables must be signed and timestamped with the production certificate; an unsigned local build is only suitable for development testing.

## Migration from Squirrel

Squirrel installs Wire per user under `%LocalAppData%`; the MSI installs it per machine under `Program Files`. Windows Installer cannot safely remove Squirrel installations from every user profile. Deployments must therefore remove the old Squirrel installation in each affected user context before assigning the MSI. Otherwise both installations can coexist and compete for shortcuts, auto-launch, and the `wire://` protocol.

Do not delete the Squirrel update feed while supported Squirrel installations remain in use.

## Release acceptance

A release candidate is acceptable only after it has been exercised on a supported Windows version and satisfies all of the following:

- The Windows WiX build completes with MSI validation and warnings-as-errors enabled.
- The MSI and every packaged executable pass `signtool.exe verify /pa /all /tw`, including their SHA-256 signatures and timestamps.
- Interactive and `/qn` installation succeed for a standard managed user with elevation supplied by the deployment system.
- Wire is installed under `Program Files` and appears exactly once in Apps & Features with the correct publisher, version, and icon.
- Start Menu and desktop shortcuts launch Wire and carry the configured application user model ID.
- The configured custom URL protocol launches the installed executable.
- `WIRE_WEBAPP_URL` configures the intended endpoint for every user, survives an upgrade where the property is omitted, and can be replaced or cleared explicitly.
- A higher version upgrades in place, leaves one Apps & Features entry, and preserves user data.
- A lower version is rejected and same-version repair does not create a second installation.
- Upgrade behaviour while Wire is running is understood and documented for the deployment policy.
- Silent uninstall removes MSI-owned files, shortcuts, and protocol registration while preserving user data.
- An MSI-installed application neither schedules Squirrel updates nor reports a missing `Update.exe`.
- Production, Internal, Wire-Gov, and custom products do not share upgrade codes.
- The managed Squirrel-to-MSI removal and installation sequence has been tested on a representative existing profile.
