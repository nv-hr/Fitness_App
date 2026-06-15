## Why

Currently, when the user opens the `food-log` or `activity` pages, the application automatically triggers plan generation. This leads to unnecessary API calls, increased token usage, and potentially slows down the user experience. By disabling the auto-generation, the user gains control over when plans are generated.

## What Changes

- Disable the automatic API fetch/generation of plans when the `food-log` page mounts.
- Disable the automatic API fetch/generation of plans when the `activity` page mounts.
- Ensure that users can still manually trigger plan generation if needed.

## Capabilities

### New Capabilities
- `manual-plan-generation`: Explicitly handle plan generation only when the user requests it instead of triggering it automatically on page load.

### Modified Capabilities

## Impact

- **Frontend**: The pages for Food Log and Activity will no longer trigger automatic fetches for plans on mount.
- **Backend/API**: Reduced number of requests to the plan generation endpoints.
- **User Experience**: Page loads will be faster, but the user must explicitly request a plan if one is not already present.
