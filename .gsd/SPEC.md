# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A full-stack fitness application that provides food and activity logging, backed by LLM-powered personalized planning based on user profiles (TDEE, BMI, etc.). It serves anyone aiming to become healthier by automating the tedious parts of tracking and planning.

## Goals
1. Add the missing target goal setting form to the first-time user onboarding pop-up.
2. Ensure the existing features (logging, LLM planning, BMI/TDEE calculation) are stable.
3. Deploy the containerized application (Docker) to Heroku (`fit-life`).

## Non-Goals (Out of Scope)
- Major new features beyond completing the existing onboarding flow and deploying.

## Users
- Anyone trying to be healthy who wants to log food/activity and receive personalized LLM-generated plans.

## Constraints
- **Stack**: React (frontend), Express (backend), Supabase (database), Open Router (LLM).
- **Deployment**: Must be deployed to Heroku (`fit-life`) via Docker container.

## Success Criteria
- [ ] First-time users see and can complete the target goal setting form.
- [ ] User goals are correctly saved and used in the LLM planning logic.
- [ ] Application is successfully deployed to Heroku and functions correctly in production.
