## ADDED Requirements

### Requirement: Maintain UI Generation Lock During Polling
The frontend SHALL maintain an active generation lock (e.g., `isBusy` or `isGenerating`) state, disabling UI generation buttons, not just during the initial generation API request, but continuously throughout the entire Smart Polling fallback phase triggered by a 409 Conflict.

#### Scenario: 409 Conflict triggers continuous UI lock
- **GIVEN** A user clicks "Generate Plan" and the UI button disables
- **WHEN** the backend returns a 409 Conflict and the frontend begins polling
- **THEN** the UI button remains disabled throughout the polling loop
- **AND** the UI button only re-enables once polling successfully completes or fails with a non-409 error
