# Phase 3 Discussion Log

- **Unused Table Deletion Strategy**
  - Options: Drop tables immediately, Rename them as backup.
  - User selected: Drop tables immediately (Cleanest)

- **Input Validation Library**
  - Options: Standardize on Zod, Use Joi, Use express-validator.
  - User selected: Standardize on Zod (Frontend already uses it, allows shared schemas)

- **LLM Input Handling**
  - Options: Silently truncate/filter bad characters, Reject the request with an error.
  - User selected: Silently truncate/filter bad characters (Better UX, assumes good intent)
