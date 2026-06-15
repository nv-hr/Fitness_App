## Why

The codebase has accumulated significant technical debt over time, including dead code, duplicated logic, complexity hotspots, and unverified security sinks. These issues increase the maintenance burden, slow down feature velocity, and pose potential security and performance risks. Cleaning this up now will ensure a healthier foundation for future development.

## What Changes

- **Dead Code Removal**: Remove 11 unused files and 31 unused exports identified by static analysis.
- **Security Sink Verification**: Review and mitigate 21 potential security findings, including SSRF, SQL Injection, and Path Traversal vulnerabilities.
- **Code Duplication Reduction**: Refactor and consolidate some of the 96 identified code clones.
- **Complexity Hotspots**: Simplify the most critical of the 94 identified complexity hotspots to improve code maintainability.

## Capabilities

### New Capabilities
- `dead-code-cleanup`: Removing unused files and unused exports across the backend and frontend.
- `security-fixes`: Mitigating potential SSRF, SQLi, and Path Traversal issues.
- `complexity-and-duplication`: Refactoring highly complex and duplicated code.

### Modified Capabilities


## Impact

- **Affected Code**: Various components in both `frontend` and `backend` workspaces.
- **APIs**: No breaking API changes are intended.
- **Dependencies**: Potential removal of unused dependencies.
- **Systems**: The overall health, performance, and security of the application will improve.
