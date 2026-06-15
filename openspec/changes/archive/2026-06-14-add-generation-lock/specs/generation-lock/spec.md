## ADDED Requirements

### Requirement: Prevent concurrent identical generations
The backend SHALL track active generation requests and reject any subsequent requests that match the same user and timeframe if a generation is already in progress.

#### Scenario: User requests weekly plan twice rapidly
- **GIVEN** A user has no active weekly plan generation
- **WHEN** user requests a weekly plan generation for week "2026-06-15"
- **AND** user immediately requests a weekly plan generation for week "2026-06-15" again
- **THEN** the first request proceeds to generate the plan
- **AND** the second request immediately returns a 409 Conflict status code

#### Scenario: Successful generation clears lock
- **GIVEN** A user's weekly plan generation is running
- **WHEN** the generation finishes successfully (or fails)
- **THEN** the lock for that user and timeframe is cleared, allowing new requests
