# SonarQube Exclusions for E2E Security Tests

This document explains why certain SonarQube rules are disabled for the e2e-security test suite.

## Excluded Rules and Rationale

### 1. Node.js Import Convention (S4328)

**Rule**: Prefer `node:fs` over `fs` **Why Excluded**:

- E2E security tests need to maintain compatibility with various Node.js versions
- Some test environments may not support the `node:` prefix
- Legacy import style is more widely compatible for testing scenarios

### 2. GlobalThis Preference (S2137)

**Rule**: Prefer `globalThis` over `window`/`global` **Why Excluded**:

- Security tests specifically need to test `window` object behavior in browser contexts
- Tests verify that `window` object is properly isolated in Electron renderer processes
- Using `globalThis` would defeat the purpose of testing browser-specific security boundaries

### 3. Empty Catch Blocks (S2486)

**Rule**: Handle exceptions or don't catch them at all **Why Excluded**:

- Security tests intentionally catch and ignore errors to test isolation boundaries
- Many tests verify that certain operations fail (throw errors) as expected
- Empty catch blocks are used to test that APIs are properly blocked/sandboxed

### 4. Unused Variables in Malicious Scripts

**Rule**: Remove unused variables **Why Excluded**:

- Malicious test scripts intentionally contain unused code to simulate real attack vectors
- These scripts are designed to test security boundaries, not code quality
- Removing "unused" code would make the security tests less realistic

## Files Affected

- `test/e2e-security/**/*` - All security test files
- `test/e2e-security/fixtures/malicious-scripts/**/*` - Intentionally malicious test scripts
- `test/e2e-security/utils/injection-helpers.ts` - Security testing utilities

## Important Notes

⚠️ **These exclusions should NOT be applied to production code**

The exclusions are specifically scoped to the `test/e2e-security/` directory to ensure that:

1. Production code still follows all quality guidelines
2. Security tests can properly validate isolation and sandboxing
3. Test fixtures can simulate realistic attack scenarios

## Reviewing Security Test Code

When reviewing security test code, focus on:

- ✅ **Security effectiveness**: Does the test properly validate security boundaries?
- ✅ **Test coverage**: Are all security scenarios covered?
- ✅ **Documentation**: Are security test intentions clear?

Rather than:

- ❌ Code style preferences that conflict with security testing needs
- ❌ Import conventions that may break test compatibility
- ❌ Error handling patterns that are intentional for security validation
