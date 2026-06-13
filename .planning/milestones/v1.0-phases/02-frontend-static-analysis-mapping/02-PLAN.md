---
must_haves:
  truths:
    - An AST parser script extracts all API calls from the frontend codebase.
    - Template literals are normalized to replace dynamic parameters with `:param`.
  artifacts:
    - .planning/phases/02-frontend-static-analysis-mapping/frontend-routes.json
    - .planning/phases/02-frontend-static-analysis-mapping/frontend-routes.md
  key_links:
    - scripts/map-frontend-routes.js
---

# Phase 2: Frontend Static Analysis & Mapping

## Plan 02-01: Build AST Parser & Generate Mapping

This plan implements the static analysis script using Babel to parse the frontend codebase, locate all API calls, and output the routes in both JSON and Markdown formats for Phase 3 to use.

### 1. Project Initialization & Dependencies
- **[x] action**: Install AST parser dependencies and create the script file.
- **files**:
  - `frontend/package.json`
  - `scripts/map-frontend-routes.js`
- **verify**: `npm list` inside `frontend/` shows `@babel/parser`, `@babel/traverse`, and `glob`.
- **done**: The script shell is created and dependencies are installed.

### 2. Implement AST Parsing Logic
- **[x] action**: Implement the parsing logic in `scripts/map-frontend-routes.js`.
  - Use `glob` to find all `.js` and `.jsx` files in `frontend/src`.
  - Read each file and parse it using `@babel/parser` with `sourceType: 'module'` and `plugins: ['jsx']`.
  - Traverse the AST to find `CallExpression` nodes where the callee name is `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiFetch`, `fetchSseStream`, or `fetch`.
  - Extract the first argument, normalizing `TemplateLiteral` values by replacing variable expressions with `:param`.
- **files**:
  - `scripts/map-frontend-routes.js`
- **verify**: The script can successfully parse a single file without crashing.
- **done**: The AST traversal logic correctly identifies and normalizes API calls.

### 3. Generate Output Formats
- **[x] action**: Update the script to aggregate all discovered routes and generate the required output files.
  - Output to `.planning/phases/02-frontend-static-analysis-mapping/frontend-routes.json`.
  - Output a Markdown table to `.planning/phases/02-frontend-static-analysis-mapping/frontend-routes.md`.
- **files**:
  - `scripts/map-frontend-routes.js`
- **verify**: Run the script and verify both output files are generated and contain correct route mappings.
- **done**: The JSON and Markdown artifacts are generated successfully.
