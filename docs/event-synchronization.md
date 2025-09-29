# Event Type Synchronization

## Overview

Wire Desktop uses a centralized event type system to ensure consistency across main, renderer, and preload processes. Due to context isolation security requirements, event types need to be shared between different process contexts.

## Architecture

- **Source of Truth**: `electron/src/lib/eventType.ts` - Main process event types
- **Shared Constants**: `electron/src/shared/contextIsolationConstants.ts` - Automatically synchronized copy for renderer/preload processes
- **Preload Scripts**: Import from shared constants for type safety

## Automated Synchronization

### Command

```bash
yarn sync:events
```

### What it does

1. **Extracts** EVENT_TYPE constants from the main process file (`electron/src/lib/eventType.ts`)
2. **Updates** the shared constants file (`electron/src/shared/contextIsolationConstants.ts`) with the latest event types
3. **Ensures** preload scripts import from the shared constants instead of maintaining duplicates

### When to run

- After adding new event types to `electron/src/lib/eventType.ts`
- When event type constants get out of sync
- As part of the build process (can be integrated into CI/CD)

## Manual Synchronization (Not Recommended)

Previously, event types were manually duplicated across files with comments like:

```typescript
// IMPORTANT: Keep in sync with ../shared/contextIsolationConstants.ts
```

This approach was error-prone and has been replaced with automated synchronization.

## Context Isolation Security

The synchronization system respects Electron's context isolation security model:

- **Main Process**: Full access to all Node.js APIs and Electron modules
- **Renderer Process**: Sandboxed environment with limited access
- **Preload Scripts**: Bridge between main and renderer with controlled API exposure

Event types are safe to share because they are just string constants that define IPC communication channels.

## Integration with Build Process

The sync command can be integrated into the build process:

```json
{
  "scripts": {
    "build:prepare": "yarn sync:events && yarn clear:wrap && yarn build:ts && yarn bundle"
  }
}
```

## Troubleshooting

### Build Errors After Sync

If you encounter build errors after running `yarn sync:events`:

1. Check that all event types in the main process file are valid TypeScript
2. Ensure no circular dependencies are introduced
3. Verify that preload scripts are importing from the correct path

### Missing Event Types

If event types are missing after sync:

1. Verify the event type exists in `electron/src/lib/eventType.ts`
2. Run `yarn sync:events` again
3. Check the console output for any error messages

### Reverting Changes

If the sync command causes issues, you can:

1. Revert the changes using git: `git checkout -- electron/src/shared/contextIsolationConstants.ts`
2. Manually fix any issues in the source file
3. Run the sync command again

## Best Practices

1. **Always run sync after modifying event types** in the main process
2. **Don't manually edit** the shared constants file - use the sync command
3. **Include sync in your development workflow** to catch issues early
4. **Test thoroughly** after synchronization to ensure all processes work correctly

## Future Improvements

- Integrate sync command into the build process automatically
- Add validation to ensure event type consistency
- Create pre-commit hooks to run sync automatically
- Add support for synchronizing other shared constants
