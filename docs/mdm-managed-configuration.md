# Wire Desktop: Managed Configuration (MDM)

This document describes how to configure Wire Desktop using Mobile Device Management (MDM) or Group Policy so that enterprises can enforce settings without user override.

## Overview

- **Platforms:** Windows and macOS. Managed configuration is read at application startup and cached for the lifetime of the process.
- **Precedence:** Managed values override user settings and file-based configuration (`init.json`). When a setting is managed, users cannot change it in the app.
- **Apply scope:** Managed configuration applies in all builds (production and internal). To target a specific backend (e.g. staging), use the appropriate Wire build and/or **webappUrl**; the environment selector is not configurable via MDM.

## Supported managed settings

| Key | Type | Description | Validation |
|-----|------|-------------|------------|
| **webappUrl** | string | Custom web app URL (e.g. on-premise). When set, the app loads this URL instead of the default backend. | `http` or `https` URI |
| **updateUrlWin** | string | Windows: URL used to check for application updates. | `http` or `https` URI |
| **proxyServerUrl** | string | Proxy server URL (e.g. `http://proxy.example.com:8080` or `https://user:password@proxy.example.com:8080`). | `http`, `https`, `socks4`, or `socks5` URI |
| **disableAutoUpdate** | boolean | If `true`, disables automatic application updates (Windows Squirrel and macOS). | boolean |
| **downloadPath** | string | Folder for user-content downloads (files from Wire), relative to the user’s home directory. Supported on Windows and macOS. | Non-empty string; must not escape home (e.g. no `..` traversal) |
| **enableSpellChecking** | boolean | Enable or disable the in-app spell checker. | boolean |
| **showMenuBar** | boolean | Show or hide the application menu bar. | boolean |
| **autoLaunch** | boolean | Start Wire when the user logs in to the OS. | boolean |
| **locale** | string | UI language. Use a two-letter code (e.g. `en`, `de`) or language-region (e.g. `pt-BR`, `en-US`). The app maps these to its supported languages. | Pattern: `[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?` |

## Windows: Group Policy / Registry

Wire Desktop reads managed configuration from the Windows Registry. You can deploy these keys via Group Policy (GPO) or any MDM that writes registry values.

### Registry locations

The app reads from **two** locations (policy overrides user):

1. **Policy (recommended):**  
   `HKCU\Software\Policies\Wire\<AppName>`
2. **User:**  
   `HKCU\Software\Wire\<AppName>`

`<AppName>` is the application name (e.g. `Wire` for production, `WireInternal` for internal builds). It is derived from the app and must contain only letters and numbers; other characters are stripped.

### Value types

- **String settings** (e.g. `webappUrl`, `proxyServerUrl`, `downloadPath`, `locale`): use `REG_SZ`.
- **Boolean settings** (e.g. `disableAutoUpdate`, `enableSpellChecking`, `showMenuBar`, `autoLaunch`): use either  
  - `REG_DWORD` with `0` (false) or `1` (true), or  
  - `REG_SZ` with `true`/`false`, `yes`/`no`, or `1`/`0`.

### Example: Group Policy (ADMX)

If you use ADMX/ADML templates, define policies under `User Configuration` → `Administrative Templates` → a custom category for Wire, and map each policy to the registry path above. Create one policy per setting and write the value to the corresponding value name (e.g. `webappUrl`, `proxyServerUrl`).

### Example: Registry script / MDM payload

```text
; Policy key (HKCU\Software\Policies\Wire\Wire)
[HKEY_CURRENT_USER\Software\Policies\Wire\Wire]
"webappUrl"="https://your-wire-backend.example.com"
"proxyServerUrl"="https://proxy.corp.example.com:8080"
"disableAutoUpdate"=dword:00000001
"downloadPath"="Documents\\WireDownloads"
"locale"="en"
"showMenuBar"=dword:00000001
```

Users must restart Wire Desktop for new or changed managed settings to take effect.

## macOS: Managed preferences

Wire Desktop reads managed configuration from the application’s preference domain (CFPreferences / `NSUserDefaults`). You can deploy these via:

- **MDM configuration profile** that configures managed app preferences for the Wire app, or  
- **`defaults write`** (or equivalent) in the app’s preference domain, deployed by your MDM or deployment tooling.

### Preference keys

Use the **exact** key names from the table above (e.g. `webappUrl`, `proxyServerUrl`, `downloadPath`, `disableAutoUpdate`, `locale`, `showMenuBar`, `autoLaunch`, `enableSpellChecking`, `updateUrlWin`).

- **String keys:** pass a string value.
- **Boolean keys:** pass a boolean (`true`/`false`) or a string that your MDM maps to a boolean.

The app reads these at launch; the preference domain is determined by the application (bundle) identity. Confirm the exact domain for your Wire Desktop build (e.g. from the app’s Info.plist or your MDM’s app catalog).

### Example: defaults (for testing or scripted deployment)

```bash
# Replace the domain with your Wire app’s bundle ID or preference domain if different
defaults write com.wearezeta.zclient.mac webappUrl "https://your-wire-backend.example.com"
defaults write com.wearezeta.zclient.mac proxyServerUrl "https://proxy.corp.example.com:8080"
defaults write com.wearezeta.zclient.mac disableAutoUpdate -bool true
defaults write com.wearezeta.zclient.mac downloadPath "Documents/WireDownloads"
defaults write com.wearezeta.zclient.mac locale "en"
```

For production deployment, use an MDM configuration profile that sets the same keys in the app’s managed preference domain so that they cannot be changed by the user.

Users must restart Wire Desktop for new or changed managed settings to take effect.

## Behaviour and security notes

- **Proxy credentials:** If you set `proxyServerUrl` with a username or password (e.g. `https://user:password@proxy:8080`), the app uses it for network requests but **never** exposes the credentials to the in-app UI or renderer process. Only the redacted URL (without user/password) is available inside the app.
- **Download path:** On Windows and macOS, `downloadPath` is interpreted relative to the user’s home directory. The app rejects paths that escape the home directory (e.g. `..` traversal). Use forward slashes or backslashes as appropriate for the platform.
- **Environment / backend:** The in-app environment selector (e.g. Production, Staging) is **not** configurable via MDM. To point users at a specific backend, set **webappUrl** to the full web app URL for that backend and use the matching Wire Desktop build if required.
- **Updates:** `updateUrlWin` applies only on Windows. `disableAutoUpdate` applies on both Windows and macOS.

## Integrating with your MDM solution

1. **Identify the app name / preference domain** for your Wire build (e.g. `Wire` vs `WireInternal`) so you target the correct registry path or preference domain.
2. **Deploy the chosen keys** using your MDM’s mechanism for registry (Windows) or managed preferences (macOS).
3. **Prefer policy / managed preference scope** so that settings are enforced and not overridable by the user.
4. **Communicate to users** that they need to restart Wire Desktop after you change managed configuration.

For implementation and validation details (e.g. schema, parsing, and tests), see the code in `electron/src/settings/ManagedConfig.ts` and the planning document `docs/mdm-review-and-improvements-plan.md`.
