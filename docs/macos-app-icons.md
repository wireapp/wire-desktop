# macOS app icons

[WPB-28748](https://wearezeta.atlassian.net/browse/WPB-28748) adds packaging support for a native Tahoe icon alongside the existing legacy icon. The native artwork and compiled catalog still need to be delivered through the branding repositories and validated on macOS before this feature ships.

## Branding inputs

`yarn configure` imports `wire-desktop/content/macos/` from the configuration repository selected by `.copyconfigrc.js` and pinned in `app-config/package.json`. Production, internal, and WireGov have separate configuration repositories. The generated `resources/` directory is ignored by Git; change the source configuration repository and update its pinned version to deliver an asset.

Each branding variant continues to provide its existing `logo.icns`. To enable its native Tahoe icon, deliver both:

- `Assets.car`, compiled from the approved Icon Composer `.icon` source.
- `CFBundleIconName` in `Info.plist.json`, matching the compiled icon name without a path or extension, for example `WireTahoe`.

Preserve the existing `CFBundleIconFile` value if supplied, or let Electron Packager retain its default. Packager copies `logo.icns` to the filename referenced by that key. Use a distinct name for the Tahoe icon. Preserve other plist entries, including any minimum OS version. Electron 38's runtime minimum is macOS 12; this feature must not raise it.

Branding without either Tahoe input continues to build with the legacy icon. Missing, empty, or incomplete icon inputs fail the build. The file checks validate presence and configuration only: they do not parse Apple's binary catalog or prove its contents match the name.

`yarn configure` removes the previously copied `Assets.car` before importing the selected branding, because `copy-config` does not remove destination files absent from the new source. Use this command when switching variants; invoking `copy-config` directly skips that cleanup.

## Compilation and packaging

Keep the editable `.icon` source, original vector layers, and regeneration instructions in the branding source repository. Record the exact Xcode version, full compiler invocation, source revision, and compiled artifact SHA-256 alongside it. Keep source materials outside the imported `wire-desktop/content/macos/` directory; that directory only needs the distributable icon inputs and existing configuration.

Generate the catalog once per branding revision using Apple's `actool`, then reuse the same file for x64, arm64, and universal builds. Normal wrapper builds consume the precompiled catalog and do not require Icon Composer. Electron Packager 17.1.2 copies `extraResource` to `Contents/Resources` before automatic signing, and before merging the two universal slices. The normal manual-signing path also receives the completed resources. The macOS resource source directory is excluded from `app.asar` to avoid shipping a duplicate catalog there.

Compiling separately for each architecture can produce different catalog bytes and break universal merging. See the [Electron Packager issue](https://github.com/electron/packager/issues/1843).

### Prove the legacy fallback before publishing artwork

Including the old `.icns` and both plist keys is necessary for this packaging approach, but does not by itself prove that older systems select the original icon. `actool` can embed fallback artwork in the catalog that older macOS prefers over the supplied `.icns`.

First compile a candidate catalog and package it with the original legacy icon. Inspect it using `xcrun assetutil --info`, then test the same bundle on Tahoe, Sequoia, and Monterey. Confirm the original legacy artwork is actually displayed, not a flattened rendering of the Tahoe icon. Only publish an artifact after that check passes.

Compiler behavior has changed between Xcode versions. The historical `--enable-icon-stack-fallback-generation=disabled` flag is undocumented and has reports of no longer working in newer compilers. Do not assume it works or select a compiler version solely from this document. A published reference uses Xcode 26.0.1 to compile the icon separately from the application; reproduce and validate any chosen procedure before adopting it.

References: [Apple's Icon Composer workflow](https://developer.apple.com/videos/play/wwdc2025/361/), [firsthand compatibility reports](https://developer.apple.com/forums/thread/794485), [hybrid icon example](https://github.com/psulak/Tahoe-Sequoia-Hybrid-Icon), [Electron 38 minimum OS](https://www.electronjs.org/blog/electron-38-0).

## Verification

Run the build-tool tests and TypeScript check:

```sh
yarn test:bin
yarn build:ts:bin
```

The macOS tests exercise legacy-only configuration, the catalog and plist pair for each architecture and signing configuration, missing inputs, branding switches, and failure propagation with source-file restoration. They use text fixtures, not real Apple catalogs. They do not establish native rendering or signing correctness.

On a Mac, build each configured branding variant using the existing macOS build commands. Check the final `.app` and the app extracted from its installer/update ZIP:

```sh
plutil -p "$APP/Contents/Info.plist"
xcrun assetutil --info "$APP/Contents/Resources/Assets.car"
codesign --verify --deep --strict --verbose=2 "$APP"
```

Verify that the catalog's icon name matches `CFBundleIconName`, that `CFBundleIconFile` resolves to the unchanged legacy icon, and that deployment requirements are unchanged. Compare the legacy icon and catalog hashes with the selected branding inputs. Validate the actual release signing and applicable notarization workflow; resource presence alone is insufficient.

The release gate is:

- Native layered rendering on macOS 26, including the available default, dark, clear, and tinted appearances.
- Original legacy icon and successful app launch on supported macOS 12, 13, 14, and 15.
- Correct Finder, Dock, and app-switcher rendering before launch, while running, and after relaunch; badges still work.
- Clean install and upgrade from the current release. Use a clean account or VM to distinguish icon cache effects from packaging defects; do not rely on globally deleting users' icon caches.
- arm64, x64, and universal packaging, with both universal slices consuming the same catalog.
- Correct production, internal, and WireGov branding, including switching configurations in one checkout.
- Valid final signatures and installer/update artifacts, plus notarization where that distribution path uses it.

Keep the PR in draft until approved assets, configuration version updates, screenshots, and macOS validation evidence are attached. Packaging support alone does not complete WPB-28748.
