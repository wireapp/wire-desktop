# Electron Security Hardening - PR Breakdown

## Prerequisites for Sandboxing

**Sandboxing requires**:

1. ✅ Context isolation enabled (mandatory)
2. ✅ @electron/remote removed (doesn't work with sandbox)
3. ✅ No Node.js APIs in preload scripts (sandbox restricts access)

**Current blockers for sandboxing**:

- `contextIsolation: false` in main window
- `@electron/remote` usage throughout codebase
- Node.js modules in preload scripts (`path`, `process`, etc.)

## PR Structure

### PR 1: Enable Context Isolation (Main Window)

**Goal**: Enable context isolation and refactor preload scripts to use contextBridge

**Files Changed**:

- `electron/src/main.ts` - Change `contextIsolation: false` → `true`
- `electron/src/preload/preload-app.ts` - Refactor to use contextBridge
- `electron/src/preload/preload-webview.ts` - Refactor to use contextBridge
- `electron/renderer/src/**` - Update all renderer code to use new APIs

**Key Changes**:

- Replace `window.sendBadgeCount` with `window.electronAPI.sendBadgeCount`
- Replace all direct window assignments with contextBridge.exposeInMainWorld()
- Update all renderer code that uses these APIs

**Testing**:

- All existing functionality works
- SSO flow works
- IPC communication works

**Dependencies**: None (can be first PR)

---

### PR 2: Replace @electron/remote - Utility Modules (Low Risk)

**Goal**: Replace remote usage in utility modules that don't affect UI

**Files Changed**:

- `electron/src/locale/index.ts` - Replace `remote.app.getLocale()` with IPC
- `electron/src/settings/SchemaUpdater.ts` - Replace `remote.app.getPath()` with IPC
- `electron/src/logging/getLogger.ts` - Replace `remote.process` and `remote.app` with IPC
- `electron/src/main.ts` - Add IPC handlers: `app:getLocale`, `app:getPath`, `process:argv`

**Key Changes**:

- Add IPC handlers in main process
- Update utility modules to use IPC when in renderer context
- Keep main process direct access when available

**Testing**:

- Locale detection works
- Config file paths are correct
- Logging works in both main and renderer

**Dependencies**: PR 1 (needs context isolation for IPC in renderer)

---

### PR 3: Replace @electron/remote - Native Theme

**Goal**: Replace remote.nativeTheme usage with IPC

**Files Changed**:

- `electron/src/preload/preload-webview.ts` - Replace `remote.nativeTheme` with IPC
- `electron/src/main.ts` - Add IPC handlers: `native-theme:shouldUseDarkColors`, `native-theme:updated` event

**Key Changes**:

- Create IPC handler for theme detection
- Broadcast theme changes to all webviews
- Expose via contextBridge in preload

**Testing**:

- Dark/light mode detection works
- Theme switching works in real-time
- No console errors

**Dependencies**: PR 1 (needs context isolation)

---

### PR 4: Replace @electron/remote - Dialog (SSO)

**Goal**: Replace remote.dialog usage in SSO error handling

**Files Changed**:

- `electron/src/sso/AutomatedSingleSignOn.ts` - Replace `remote.dialog.showMessageBox()` with IPC
- `electron/src/main.ts` - Add IPC handler: `dialog:showMessageBox`

**Key Changes**:

- Create IPC handler that shows dialog in main process
- Return dialog result via IPC
- Update SSO error handling to use IPC

**Testing**:

- SSO error dialog appears when max accounts reached
- Dialog buttons work correctly
- SSO flow continues to work

**Dependencies**: PR 1 (needs context isolation)

---

### PR 5: Replace @electron/remote - Context Menu (Complex)

**Goal**: Replace remote.Menu, remote.getCurrentWebContents(), remote.getCurrentWindow()

**Files Changed**:

- `electron/src/preload/menu/preload-context.ts` - Replace all remote usage
- `electron/src/main.ts` - Add IPC handlers if needed (may not be needed - Menu works in preload)

**Key Changes**:

- Replace `remote.Menu` with `Menu` from `electron` (available in preload)
- Replace `remote.getCurrentWebContents()` - may need IPC or pass via contextBridge
- Replace `remote.getCurrentWindow()` - may need IPC or pass via contextBridge
- Update menu.popup() calls

**Testing**:

- All context menu types work (text, image, link, selection)
- Menu positioning is correct
- No console errors

**Dependencies**: PR 1 (needs context isolation)

---

### PR 6: Remove @electron/remote Package

**Goal**: Remove all remoteMain initialization and the package dependency

**Files Changed**:

- `electron/src/main.ts` - Remove `remoteMain.initialize()` and all `remoteMain.enable()` calls
- `package.json` - Remove `@electron/remote` dependency

**Key Changes**:

- Remove remoteMain imports
- Remove remoteMain.initialize()
- Remove remoteMain.enable() calls
- Remove package from dependencies

**Testing**:

- App starts correctly
- No remote-related errors
- All functionality still works

**Dependencies**: PRs 2, 3, 4, 5 (all remote usage must be replaced first)

---

### PR 7: Enable Sandbox (Main Window)

**Goal**: Enable sandbox for main window

**Files Changed**:

- `electron/src/main.ts` - Change `sandbox: false` → `true` in main window

**Key Changes**:

- Enable sandbox in webPreferences
- Verify preload scripts work in sandboxed context
- Ensure no Node.js APIs are used in preload

**Blockers Check**:

- ✅ Context isolation enabled (PR 1)
- ✅ @electron/remote removed (PR 6)
- ⚠️ Node.js modules in preload - need to check:
  - `path` module in preload-app.ts and preload-webview.ts
  - `getLogger` uses path - needs IPC or refactor

**Testing**:

- All functionality works
- SSO works
- No security warnings
- Performance is acceptable

**Dependencies**: PR 1, PR 6 (context isolation + remote removal)

---

### PR 8: Enable Sandbox (Webviews)

**Goal**: Enable sandbox for webviews

**Files Changed**:

- `electron/src/main.ts` - Change `sandbox: false` → `true` in webview configuration (line 679)

**Key Changes**:

- Enable sandbox for webviews
- Verify SSO JavaScript injection still works (`executeJavaScriptWithoutResult`)
- Ensure webview preload works in sandboxed context

**Critical SSO Test**:

- SSO window opens
- SSO login completes
- JavaScript injection for SSO response works
- Cookie transfer works

**Testing**:

- All webview functionality works
- SSO flow works completely
- No security warnings

**Dependencies**: PR 7 (main window sandbox first)

---

## Node.js Modules in Preload Scripts

### Current Usage:

- `path` module in `preload-app.ts` and `preload-webview.ts` (line 23)
- Used for: `path.basename(__filename)` in getLogger calls

### Solution Options:

1. **Remove path usage**: Pass logger name as parameter instead of using `__filename`
2. **Use IPC**: Get path info via IPC (overkill for this)
3. **Use string manipulation**: Replace `path.basename(__filename)` with string operations

**Recommended**: Option 1 - Pass logger name explicitly or use a different method

**Files to Update**:

- `electron/src/preload/preload-app.ts` - Remove `path` import, pass logger name explicitly
- `electron/src/preload/preload-webview.ts` - Remove `path` import, pass logger name explicitly

This should be done in **PR 1** or **PR 7** (before enabling sandbox).

---

## PR Dependencies Graph

```
PR 1 (Context Isolation)
  ├─> PR 2 (Remote - Utilities)
  ├─> PR 3 (Remote - Native Theme)
  ├─> PR 4 (Remote - Dialog)
  └─> PR 5 (Remote - Context Menu)
        │
        └─> PR 6 (Remove Remote Package)
              │
              └─> PR 7 (Sandbox Main Window)
                    │
                    └─> PR 8 (Sandbox Webviews)
```

## Testing Strategy Per PR

Each PR should include:

1. Unit tests pass
2. Integration tests pass
3. Manual SSO testing (for PRs that touch SSO)
4. Manual functionality testing
5. No console errors or warnings

## Estimated Timeline

- PR 1: 3-5 days
- PR 2: 1-2 days
- PR 3: 1-2 days
- PR 4: 1-2 days
- PR 5: 3-4 days (most complex)
- PR 6: 1 day
- PR 7: 2-3 days
- PR 8: 2-3 days

**Total**: ~2-3 weeks

## Critical Path

The critical path for sandboxing is:

1. PR 1 (Context Isolation) - Foundation
2. PR 6 (Remove Remote) - Required for sandbox
3. PR 7 (Sandbox Main) - First sandbox
4. PR 8 (Sandbox Webviews) - Complete sandbox

PRs 2-5 can be done in parallel after PR 1, but PR 6 must wait for all of them.
