# Phase 2: Frontend Static Analysis & Mapping - Research

## Context
This phase will build an automated mapping tool that scans the frontend codebase to find all backend API calls, producing a comprehensive list of active routes. This mapping will be used in Phase 3 to safely prune unused backend routes and database tables.

## Implementation Approach: AST Parsing Script

Based on the discussion context, we must build a custom Node.js script using an AST parser.

### Frontend Architecture Patterns
1. **API Call Centralization:** The frontend is a Vite + React application (`.js`/`.jsx`). Direct `fetch()` calls are rare. Most API interaction is done via custom wrappers in `src/shared/lib/http.js`:
   - `apiGet`
   - `apiPost`
   - `apiPut`
   - `apiDelete`
   - `apiFetch`
   - `fetchSseStream`
2. **Feature Modules:** These wrappers are imported and used in feature-specific API files (e.g., `src/features/progress/api/weightApi.js`).
3. **Template Literals:** Route paths are often constructed dynamically using template literals (e.g., `` apiGet(`/api/progress/weight?limit=${limit}`) `` or `` apiDelete(`/api/progress/weight/${id}`) ``).

### Proposed Solution
We should build a standalone Node.js script (e.g., `scripts/map-frontend-routes.js`) that uses Babel to parse the frontend source code.

#### 1. Required Libraries
- `@babel/parser`: To parse `.js`/`.jsx` files into an AST.
- `@babel/traverse`: To walk the AST and find specific function calls.
- `glob`: To locate all relevant source files in `frontend/src/**/*.js` and `**/*.jsx`.

#### 2. AST Traversing Logic
- Walk the AST looking for `CallExpression` nodes.
- Check if `node.callee.name` matches one of the known wrapper functions (`apiGet`, `apiPost`, etc.) or `fetch`.
- If a match is found, extract the first argument (`node.arguments[0]`).
- **Literal Extraction:** If it's a `StringLiteral`, extract the value directly.
- **Template Literal Extraction:** If it's a `TemplateLiteral`, normalize the route by replacing expressions with a generic placeholder (e.g., `/:param`). This helps match the route against Express route definitions (like `/api/progress/weight/:id`).

#### 3. Output Generation
As decided in the phase context, the script must output two formats:
1. **JSON Output** (`.planning/phases/02-frontend-static-analysis-mapping/frontend-routes.json`): A structured list of discovered routes grouped by HTTP method, containing the file path and line number where the call was found. This will be consumed by Phase 3 scripts.
2. **Markdown Output** (`.planning/phases/02-frontend-static-analysis-mapping/frontend-routes.md`): A human-readable table summarizing the routes, HTTP methods, and their usage locations.

## Potential Pitfalls
- **Dynamic Imports/Base URLs:** The `http.js` module prepends `API_BASE` to all routes. The parser only needs to extract the path portion passed to the wrappers.
- **Unmatched `fetch` calls:** While wrappers are standard, we should also scan for raw `fetch()` calls in case any components bypass the `http.js` module.
- **Complex Template Literals:** If a template literal has complex conditional expressions, normalization might be tricky. The script should handle basic `${id}` or `${query}` interpolations robustly.

## Next Steps for Planning
1. Create a `package.json` script or standalone Node script in a `scripts/` directory.
2. Install the necessary `@babel/*` parsing packages (can be `devDependencies` in the root or in `frontend/`).
3. Write the AST traversal logic.
4. Execute the script to generate the JSON and Markdown artifacts.

## RESEARCH COMPLETE
