# Frontend Analysis for v1.2 Milestone

## 1. Current Frontend State

The frontend is currently a React application structured around feature modules, using functional components, standard hooks, and a centralized routing setup. Based on the `frontend/src` directory, the following modules are present and functional:

- **Activities (`activities/`)**: Includes `ActivitiesPage`, `ActivityCard`, and `ActivityPool`. Handles the dummy/randomized physical activity recommendations.
- **Authentication (`auth/`)**: Includes `LoginForm`, `RegisterForm`, and a `useAuth` hook. Handles user login, registration, and session management (JWT/Google OAuth).
- **Food Logging (`food-log/`)**: The most complex feature set. Includes `FoodLogPage`, `FoodLogTable`, `FoodSearch`, `CalorieSummary`, `CalorieHistory`, and `CustomFoodForm`. Supports ingredient-level logging, calorie calculations, and custom food entry.
- **User Profile (`profile/`)**: Includes `ProfileForm` for capturing basic stats (weight, height, age, gender, activity level) and displays outputs via `BmiResult` and `TdeeResult`.
- **Shared (`shared/`)**: Contains generic configurations like `http.js` (API communication), `translations.js` (i18n, currently adapted for English), and a `useResponsive` hook.

**Current Core UI**: It successfully satisfies the v1.0 and v1.1 requirements of BMI/TDEE calculation, ingredient-based food logging with calculated calories, calorie balance visualization, and activity recommendations. The UI language is now English.

---

## 2. Missing Frontend Features for v1.2

Based on the `PROJECT.md` next milestone goals and deferred items, the upcoming v1.2 milestone aims to introduce advanced features that go beyond basic calorie tracking. The key missing features on the frontend are:

1. **Advanced Nutrition Tracking (Macros)**: Moving beyond just calories to track macronutrients (Proteins, Fats, Carbohydrates).
2. **Meal Planning**: Allowing users to plan meals ahead of time, separate from their daily consumed food log.
3. **Progress Charts**: Visualizing historical health data (weight changes, calorie adherence, macro trends) over time.
4. **Export Functionality**: Providing a way for users to download their personal data.
5. *(Optional/Deferred)* **Notifications & Settings**: Allowing users to set reminders for meals or weekly summaries.

---

## 3. Recommended New Components, Pages, and State Updates

To support the v1.2 goals, the following additions to the frontend architecture are recommended:

### A. Advanced Nutrition Tracking (Macros)
*   **New Feature Directory**: Integrate into existing `food-log` or create a new `nutrition` module.
*   **Components**:
    *   `MacroSummary` / `MacroProgress`: A component (e.g., progress bars or a pie chart) to display daily consumed macros versus daily targets.
    *   `MacroTargetsForm`: A modal or section within the Profile page allowing users to set specific macro goals (e.g., 40% Protein, 30% Fat, 30% Carbs).
*   **State/API Updates**:
    *   Extend `foodLogApi.js` to fetch and submit macro data alongside calories.
    *   Update `FoodLogTable` to display macro columns (P/F/C).

### B. Progress Visualization
*   **New Feature Directory**: `features/progress/`
*   **Components**:
    *   `ProgressDashboardPage`: A dedicated page for visualizing trends over weeks or months.
    *   `WeightChart`: A line chart tracking user weight entries over time.
    *   `CalorieAdherenceChart`: A bar or line chart comparing TDEE targets against actual consumed calories over time.
*   **Dependencies**: Need to introduce a charting library (e.g., `recharts` or `chart.js`).
*   **State/API Updates**:
    *   `progressApi.js` to fetch aggregated historical data (weight logs, daily calorie totals) from the backend.

### C. Meal Planning
*   **New Feature Directory**: `features/meal-planner/`
*   **Components**:
    *   `MealPlannerPage`: The main view for future meal planning.
    *   `WeeklyCalendarView`: A UI component to select days of the week.
    *   `MealPlanDay`: A component showing planned ingredients/meals for a specific future date, reusing parts of `FoodSearch`.
*   **State/API Updates**:
    *   `mealPlannerApi.js` to handle CRUD operations for future-dated meal plans.

### D. Data Export Functionality
*   **Components**:
    *   `DataExportPanel`: A section likely housed within the `ProfileForm` or a new `SettingsPage`.
    *   `ExportButton`: A generic button component handling the async request to generate and download a CSV/PDF report.
*   **State/API Updates**:
    *   Extend `profileApi.js` or add an `exportApi.js` to trigger the backend export endpoint and handle file blob downloads.

### E. Global/State Management Adjustments
*   As the application state grows with macros and historical data, the current prop-drilling or localized component state might become cumbersome. Consider implementing React Context for global user settings (like macro targets or selected date for logging/planning) if not already using a state management library like Redux or Zustand.
