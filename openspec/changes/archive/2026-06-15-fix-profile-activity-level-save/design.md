## Context

The `activity_level` field is essential for calculating the Total Daily Energy Expenditure (TDEE). A bug was identified where the `activity_level` was not being properly saved to the database. Upon investigation, it was discovered that the root cause was the physical absence of the `activity_level` column and its associated ENUM type in the running PostgreSQL database, rather than an enum value mismatch between the frontend and backend.

## Goals / Non-Goals

**Goals:**
- Ensure the `activity_level` column exists in the `profiles` table in the database.
- Create the correct PostgreSQL ENUM type (`'sedentary', 'light', 'moderate', 'very_active', 'extra_active'`) to match the frontend payloads.
- Update API documentation to correctly reflect `'very_active'` instead of `'active'`.

**Non-Goals:**
- Changing the underlying mathematical formulas for TDEE calculations.
- Modifying frontend data schemas, as they already match the intended database design.

## Decisions

- **Database Synchronization**: The database schema must be explicitly synchronized by creating the ENUM type and adding the column, as the database was missing this field.
- **Documentation Update**: `docs.routes.js` will be updated to reflect the true enum values to prevent future confusion.

## Risks / Trade-offs

- **Risk: Breaking existing TDEE calculations** -> Mitigation: By ensuring the database ENUM matches the existing backend `multipliers` mapping, the TDEE math is perfectly preserved without needing adapter logic.
