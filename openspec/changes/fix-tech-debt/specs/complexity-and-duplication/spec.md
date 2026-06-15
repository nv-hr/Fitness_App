## ADDED Requirements

### Requirement: Reduce code duplication
The system SHALL consolidate identical logic blocks into shared helper functions.

#### Scenario: Reviewing duplication
- **WHEN** running fallow dupes analysis
- **THEN** the number of duplicate code blocks is significantly reduced

### Requirement: Simplify complex hotspots
The system SHALL refactor methods with high cyclomatic complexity.

#### Scenario: Reviewing complexity
- **WHEN** running fallow health analysis
- **THEN** the peak complexity score across the codebase is reduced
