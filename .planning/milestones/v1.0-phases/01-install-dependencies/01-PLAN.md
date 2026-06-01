---
wave: 1
id: "01-install"
title: "Install dependencies and verify environment"
depends_on: []
files_modified:
  - "node_modules/"
  - "backend/node_modules/"
  - "frontend/node_modules/"
  - "package-lock.json"
requirements: [INFRA-01, INFRA-02]
autonomous: true
---

# Plan: Install Dependencies

## Objective
Install all npm packages and verify the project has its required environment configuration.

## Tasks

### Task 1: Install root workspace dependencies
<read_first>
- package.json (root)
</read_first>
<action>
Run `npm install` at the project root to install all workspace dependencies (frontend + backend).
Lockfiles are gitignored so fresh install from package.json specs is expected.
</action>
<acceptance_criteria>
- Exit code 0 from npm install
- node_modules/ exists at root
- backend/node_modules/ exists
- frontend/node_modules/ exists
</acceptance_criteria>

### Task 2: Verify .env configuration
<read_first>
- .env
</read_first>
<action>
Check that .env exists and contains at minimum: DATABASE_URL, JWT_SECRET.
The .env file already exists — verify it has the required variables.
</action>
<acceptance_criteria>
- .env file exists
- DATABASE_URL is set
- JWT_SECRET is set
</acceptance_criteria>

---
wave: 1
id: "01-verify-tests"
title: "Verify test modules resolve"
depends_on: ["01-install"]
files_modified: []
requirements: [INFRA-05]
autonomous: true
---

# Plan: Verify Test Resolution

## Objective
Run `npm test` to verify that modules resolve without import errors.

## Tasks

### Task 1: Run backend tests
<read_first>
- backend/package.json
</read_first>
<action>
Run `npm test --workspace=backend` from the project root.
Tests may fail due to missing database connection, but module imports should resolve without errors.
</action>
<acceptance_criteria>
- Test runner starts and discovers test files
- No MODULE_NOT_FOUND or import resolution errors
- Tests that require DB connection may fail with connection errors (acceptable)
</acceptance_criteria>

### Task 2: Run lint/type check
<read_first>
- tsconfig.json
</read_first>
<action>
Run `npm run lint` (tsc --noEmit) to verify TypeScript type checking passes.
</action>
<acceptance_criteria>
- `npm run lint` exits with code 0 or produces only expected warnings
</acceptance_criteria>
