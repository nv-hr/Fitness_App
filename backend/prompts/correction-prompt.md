The weekly plan you generated did not pass validation. Issues found:

{{validationErrors}}

Please generate a corrected version following these rules:
- Return ONLY valid JSON, no markdown
- Use ONLY activity names from the originally provided list
- Each activity name must match exactly
- Duration must be between 10-180 minutes
- Exactly 7 consecutive days
- 1-4 activities per day on activity days
- Activity days: rest_day=false with 1-4 activities
- Rest days: rest_day=true with empty activities array
- Every day MUST include the rest_day field
- Include "format_version": 1 at the root level
