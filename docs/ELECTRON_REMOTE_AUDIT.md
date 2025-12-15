# @electron/remote Usage Audit

**Date**: 2024  
**Purpose**: Document all `@electron/remote` usage and plan replacement strategy for security hardening

## Summary

Total files using `@electron/remote`: **7 files**

- Main process initialization: 1 file
- Preload scripts: 2 files
- Utility modules: 4 files

## Main Process Initialization

### File: `electron/src/main.ts`

**Usage**:

```typescript
import * as remoteMain from '@electron/remote/main';
remoteMain.initialize(); // Line 78
remoteMain.enable(main.webContents); // Line 307
remoteMain.enable(contents); // Line 660 (for all webContents)
```

**Purpose**:

- Initializes the remote module system
- Enables remote access for main window and all webviews

**Replacement Strategy**:

- Remove all `remoteMain.enable()` calls after replacing all remote usage
- Remove `remoteMain.initialize()` after all remote usage is replaced
- This is the LAST step - only remove after all other remote usage is eliminated

**Dependencies**: All other remote usage depends on this

---

## Preload Scripts

### File: `electron/src/preload/preload-webview.ts`

**Usage**:

```typescript
const remote = require('@electron/remote');

// Line 52, 59: Get dark mode state
const useDarkMode = remote.nativeTheme.shouldUseDarkColors;

// Line 69: Listen for theme changes
remote.nativeTheme.on('updated', () => updateWebAppTheme());
```

**Context**: Webview preload script - runs in webview renderer process

**Purpose**:

- Detect system dark/light mode preference
- React to theme changes in real-time
- Publish theme updates to webapp via amplify events

**Replacement Strategy**:

1. **Create IPC Handler in Main Process** (`electron/src/main.ts`):

```typescript
// Add to bindIpcEvents() or create new function
ipcMain.handle('native-theme:shouldUseDarkColors', () => {
  return nativeTheme.shouldUseDarkColors;
});

// Listen for theme changes and notify renderers
nativeTheme.on('updated', () => {
  // Broadcast to all webviews
  main.webContents.send('native-theme:updated', {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  });
});
```

2. **Expose via ContextBridge** (in preload script):

```typescript
import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  nativeTheme: {
    shouldUseDarkColors: () => ipcRenderer.invoke('native-theme:shouldUseDarkColors'),
    onUpdated: (callback: (shouldUseDarkColors: boolean) => void) => {
      ipcRenderer.on('native-theme:updated', (_event, {shouldUseDarkColors}) => {
        callback(shouldUseDarkColors);
      });
    },
  },
});
```

3. **Update Usage**:

```typescript
// Replace:
const useDarkMode = remote.nativeTheme.shouldUseDarkColors;

// With:
const useDarkMode = window.electronAPI.nativeTheme.shouldUseDarkColors();

// Replace:
remote.nativeTheme.on('updated', () => updateWebAppTheme());

// With:
window.electronAPI.nativeTheme.onUpdated(shouldUseDarkColors => {
  // Update theme logic
});
```

**Complexity**: Medium  
**Risk**: Low - Theme detection is straightforward  
**Testing**: Verify dark/light mode switching works

---

### File: `electron/src/preload/menu/preload-context.ts`

**Usage**:

```typescript
const remote = require('@electron/remote');

// Line 64, 113, 116: Build context menus
remote.Menu.buildFromTemplate([...]);

// Line 127: Get current webContents
const webContents = remote.getCurrentWebContents();

// Line 130: Get current window
const window = remote.getCurrentWindow();
```

**Context**: Context menu preload script - runs in main window renderer process

**Purpose**:

- Create context menus (text menu, image menu, default menu)
- Get current webContents for menu operations
- Get current window for menu popup positioning

**Replacement Strategy**:

1. **Menu Building**:

   - Menus can be built in preload script using `Menu` from `electron` (not remote)
   - `Menu` is available in preload context when context isolation is enabled
   - **Change**: `const {Menu} = require('electron')` instead of `remote.Menu`

2. **getCurrentWebContents()**:

   - In preload script, we can use `webContents` from the context
   - However, since this is for the main window, we need to pass webContents ID from main process
   - **Alternative**: Use IPC to get webContents ID, or pass it during preload initialization
   - **Better approach**: Since this is in the main window preload, we can access `webContents` directly if available
   - **Note**: Need to verify if `webContents` is accessible in preload with context isolation

3. **getCurrentWindow()**:
   - Similar to webContents - need window reference
   - **Alternative**: Pass window ID via IPC or during initialization
   - **Better approach**: Menu.popup() can work without explicit window reference in some cases

**Detailed Replacement**:

```typescript
// Replace remote import
import {Menu, WebContents} from 'electron';

// For getCurrentWebContents - we need to get it from main process
// Option 1: Pass webContents ID via IPC during initialization
// Option 2: Use a global that's set by main process
// Option 3: Create IPC handler to get current webContents ID

// For getCurrentWindow - similar approach
// Menu.popup() can work with just options, window is optional

// Create IPC handler in main process:
ipcMain.handle('get-current-webcontents-id', event => {
  return event.sender.id;
});

ipcMain.handle('get-current-window-id', event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window?.id;
});

// In preload:
const webContentsId = await ipcRenderer.invoke('get-current-webcontents-id');
const windowId = await ipcRenderer.invoke('get-current-window-id');

// But actually, for context menus, we might not need the window reference
// Menu.popup() can infer it from the event
```

**Actually, simpler approach**:

- `Menu.buildFromTemplate()` works with regular `Menu` import (not remote)
- For `menu.popup()`, we can pass `{window: null}` or get window via IPC
- For `webContents.replaceMisspelling()`, we need webContents reference - pass via IPC

**Complexity**: High - Context menu system is complex  
**Risk**: Medium - Context menus are user-facing, must work correctly  
**Testing**: Test all context menu types (text, image, link, selection)

---

## Utility Modules

### File: `electron/src/logging/getLogger.ts`

**Usage**:

```typescript
const mainProcess = process || require('@electron/remote').process;
const app = Electron.app || require('@electron/remote').app;

// Line 36: Check command line arguments
const forceLogging = mainProcess.argv.includes('--enable-logging');

// Line 32: Get user data path
const logDir = path.join(app.getPath('userData'), 'logs');
```

**Context**: Utility module - may run in main or renderer process

**Purpose**:

- Access process.argv for logging flags
- Get app.getPath('userData') for log directory

**Replacement Strategy**:

1. **For Main Process** (when `process` is available):

   - Use `process` directly - no change needed
   - Use `app` directly from `electron` - no change needed

2. **For Renderer Process** (when remote is used):

   - **process.argv**: Create IPC handler `ipcMain.handle('process:argv', () => process.argv)`
   - **app.getPath()**: Create IPC handler `ipcMain.handle('app:getPath', (event, name) => app.getPath(name))`

3. **Update Code**:

```typescript
// Detect if we're in main or renderer
const isMainProcess = typeof process !== 'undefined' && process.type === 'browser';

let processArgv: string[] = [];
let getUserDataPath: () => string;

if (isMainProcess) {
  processArgv = process.argv;
  getUserDataPath = () => app.getPath('userData');
} else {
  // Renderer process - use IPC
  processArgv = await ipcRenderer.invoke('process:argv');
  getUserDataPath = () => ipcRenderer.invoke('app:getPath', 'userData');
}
```

**Note**: `getLogger` is used in both main process (main.ts, settings, etc.) and preload scripts (preload-app.ts, preload-webview.ts), so it must handle both contexts.

**Implementation**:

```typescript
import {ipcRenderer} from 'electron';

const isMainProcess = typeof process !== 'undefined' && process.type === 'browser';

let processArgv: string[] = [];
let getUserDataPath: () => string | Promise<string>;

if (isMainProcess) {
  // Main process - direct access
  processArgv = process.argv;
  getUserDataPath = () => app.getPath('userData');
} else {
  // Renderer process - use IPC (requires contextBridge setup)
  // Note: This will need to be async or use synchronous IPC
  // For now, we can make it async and update callers
  processArgv = []; // Will be populated via IPC
  getUserDataPath = async () => {
    // Requires IPC handler: ipcMain.handle('app:getPath', (event, name) => app.getPath(name))
    return await ipcRenderer.invoke('app:getPath', 'userData');
  };
}

// Update ENABLE_LOGGING to be async-aware or use synchronous approach
const forceLogging = isMainProcess ? process.argv.includes('--enable-logging') : false; // Will need IPC to check in renderer, or pass via contextBridge
```

**Alternative Simpler Approach**: Since logging initialization happens early, we can:

1. Pass logging config via contextBridge during preload initialization
2. Or make the check synchronous by exposing it via contextBridge

**Complexity**: Medium (due to dual context usage)  
**Risk**: Low  
**Testing**: Verify logging works in both main and renderer contexts

---

### File: `electron/src/locale/index.ts`

**Usage**:

```typescript
const app = Electron.app || require('@electron/remote').app;

// Line 144: Get system locale
const defaultLocale = parseLocale(app.getLocale().substring(0, 2));
```

**Context**: Utility module - may run in main or renderer process

**Purpose**:

- Get system locale for language detection

**Replacement Strategy**:

1. **For Main Process**: Use `app` directly - no change needed

2. **For Renderer Process**:

   - Create IPC handler: `ipcMain.handle('app:getLocale', () => app.getLocale())`
   - Use IPC in renderer: `const locale = await ipcRenderer.invoke('app:getLocale')`

3. **Update Code**:

```typescript
const isMainProcess = typeof process !== 'undefined' && process.type === 'browser';

let getLocale: () => string;

if (isMainProcess) {
  getLocale = () => app.getLocale();
} else {
  getLocale = async () => await ipcRenderer.invoke('app:getLocale');
}
```

**Complexity**: Low  
**Risk**: Low  
**Testing**: Verify locale detection works correctly

---

### File: `electron/src/settings/SchemaUpdater.ts`

**Usage**:

```typescript
const app = Electron.app || require('@electron/remote').app;

// Line 32: Get user data path
const defaultPathV0 = path.join(app.getPath('userData'), 'init.json');
const defaultPathV1 = path.join(app.getPath('userData'), 'config/init.json');
```

**Context**: Utility module - likely runs in main process only

**Purpose**:

- Get user data directory for config file paths

**Replacement Strategy**:

1. **Check where this is used**: If only in main process, use `app` directly
2. **If used in renderer**: Create IPC handler `ipcMain.handle('app:getPath', (event, name) => app.getPath(name))`

**Complexity**: Low  
**Risk**: Low  
**Testing**: Verify config file paths are correct

---

### File: `electron/src/sso/AutomatedSingleSignOn.ts`

**Usage**:

```typescript
const dialog = Electron.dialog || require('@electron/remote').dialog;

// Line 42: Show error dialog
await dialog.showMessageBox({
  detail,
  message,
  type: 'warning',
});
```

**Context**: SSO automation - runs in renderer process (preload-app.ts calls this)

**Purpose**:

- Show error dialog when maximum accounts reached during SSO

**Replacement Strategy**:

1. **Create IPC Handler** in main process:

```typescript
ipcMain.handle('dialog:showMessageBox', async (event, options) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showMessageBox(window || undefined, options);
  return result;
});
```

2. **Update Code**:

```typescript
// Remove remote import
// Add IPC call
const result = await ipcRenderer.invoke('dialog:showMessageBox', {
  detail,
  message,
  type: 'warning',
});
```

**Complexity**: Low  
**Risk**: Medium - SSO error handling is important  
**Testing**: Test SSO with maximum accounts reached, verify dialog appears

---

## Replacement Priority Order

1. **Low Risk, Simple**:

   - `locale/index.ts` - app.getLocale()
   - `settings/SchemaUpdater.ts` - app.getPath()
   - `logging/getLogger.ts` - process.argv, app.getPath()

2. **Medium Risk, Medium Complexity**:

   - `preload/preload-webview.ts` - nativeTheme
   - `sso/AutomatedSingleSignOn.ts` - dialog.showMessageBox

3. **High Risk, High Complexity**:

   - `preload/menu/preload-context.ts` - Menu, getCurrentWebContents, getCurrentWindow

4. **Final Step**:
   - `main.ts` - Remove remoteMain.initialize() and remoteMain.enable() calls

## Testing Checklist for Each Replacement

- [ ] Functionality works as before
- [ ] No console errors
- [ ] No performance regressions
- [ ] SSO flow works (for SSO-related changes)
- [ ] Context menus work (for menu changes)
- [ ] Theme switching works (for theme changes)
- [ ] Error dialogs appear (for dialog changes)

## Notes

- All replacements assume context isolation is enabled (Phase 2)
- IPC handlers should be added to `bindIpcEvents()` or a similar centralized location
- Consider creating a typed IPC API for better maintainability
- Some replacements may require updating TypeScript types

## Estimated Effort

- Low complexity: 1-2 hours each (3 files)
- Medium complexity: 2-4 hours each (2 files)
- High complexity: 4-6 hours (1 file)
- Testing and verification: 4-6 hours

**Total**: ~20-30 hours
