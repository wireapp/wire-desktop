# macOS app icons

`yarn configure` imports macOS resources from the branding repository pinned in `app-config/package.json`. To enable a native Tahoe icon, publish `Assets.car` and its matching `CFBundleIconName` in `wire-desktop/content/macos/Info.plist.json`. Keep the existing `logo.icns`, `CFBundleIconFile`, and deployment settings for older macOS. Configurations without Tahoe assets retain legacy behavior.

Compile the catalog once per branding revision and reuse it for all architectures. Packager copies it into `Contents/Resources` before signing; compiling separately for universal slices can produce incompatible file hashes. `yarn configure` removes any previously copied catalog before switching branding.

Keep the `.icon` source and regeneration instructions (exact compiler version and command) in the branding repository. Do not commit generated `resources/` files to wire-desktop. Update configuration pins when approved assets are published.

**Before shipping:** verify the same packaged app displays the layered icon on Tahoe and the original legacy artwork on supported macOS 12–15. Merely including both assets does not guarantee this: compiler-generated fallback images can override the old icon. See [Apple's developer discussion](https://developer.apple.com/forums/thread/794485) and the [hybrid icon example](https://github.com/psulak/Tahoe-Sequoia-Hybrid-Icon).

Validate Finder, Dock, app switching, appearances, and an upgrade installation. Check production, internal, and WireGov branding; arm64/x64/universal artifacts; final signatures and applicable notarization. Inspect bundle metadata with `plutil`, catalog contents with `xcrun assetutil --info`, and signatures with `codesign --verify --deep --strict`.

The configuration tests use fixtures and cannot establish native rendering or signing correctness. [WPB-28748](https://wearezeta.atlassian.net/browse/WPB-28748) remains incomplete until the actual artwork, configuration pins, and macOS validation evidence are delivered.
