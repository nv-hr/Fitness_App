The meal plan you generated did not pass validation. Issues found:

{{validationErrors}}

Please generate a corrected version following these rules:
- Return ONLY valid JSON, no markdown, no explanation, no code fences
- Use ONLY food names from the originally provided Available Foods list
- Each food item must include both `food_id` and `food_name` matching the Available Foods list
- `food_name` must match exactly (case-sensitive)
- Exactly 7 consecutive days starting from the original week start date
- EVERY day MUST have exactly 4 meal slots: breakfast, lunch, dinner, snack
- Each meal slot MUST have 1-4 food items
- `portion_grams` MUST be an integer between 10 and 500
- Daily total calories should be within 80-120% of the user's daily calorie target
