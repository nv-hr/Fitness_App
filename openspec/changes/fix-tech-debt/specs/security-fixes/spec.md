## ADDED Requirements

### Requirement: Prevent Path Traversal
The system SHALL sanitize all paths resolved from user input to ensure they cannot escape the intended directory.

#### Scenario: Malicious path input
- **WHEN** a user provides `../../etc/passwd` as input
- **THEN** the system rejects the path resolution or sanitizes it

### Requirement: Prevent SSRF
The system SHALL only make outbound HTTP requests to an explicitly allowed list of destination hosts.

#### Scenario: Unallowed host fetch
- **WHEN** the system attempts to fetch an unallowed host
- **THEN** the request is blocked and an error is logged

### Requirement: Parameterized SQL queries
The system SHALL use parameterized bindings for all database queries involving user input.

#### Scenario: SQL Injection attempt
- **WHEN** a user provides `' OR 1=1 --` as input
- **THEN** the query safely escapes the input without executing it as SQL

### Requirement: No PII Logging
The system SHALL NOT log unredacted HTTP request inputs that may contain PII.

#### Scenario: Request logging
- **WHEN** the controller handles a request
- **THEN** the sensitive data in the request body is not printed to stdout
