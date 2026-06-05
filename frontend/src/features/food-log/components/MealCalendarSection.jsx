/**
 * MealCalendarSection.jsx
 *
 * Why: Previously 618 lines mixing UI, API calls, countdown timers, and
 * toast state. Now an orchestrator (~100 lines) that delegates:
 *  - All state & API logic → useMealCalendar hook
 *  - Individual meal cards  → MealCard component
 *  - Shared widgets         → AiBannerCard, DateSwitcher, SectionHeader, Toast
 */

import { format } from 'date-fns';
import { useMealCalendar } from '../hooks/useMealCalendar.js';
import MealCard from './MealCard.jsx';
import { AiBannerCard, DateSwitcher, SectionHeader, Toast } from '../../../shared/ui/index.js';
import { RefreshCw, AlertCircle } from 'lucide-react';

/** Sort order for the four meal types. */
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * The daily meal plan section: AI generation banner, date switcher,
 * and a list of meal cards for the selected day.
 *
 * @param {object}   [props]
 * @param {Function} [props.onDaySelect] - Optional callback when the active day changes.
 * @returns {JSX.Element}
 */
export default function MealCalendarSection({ onDaySelect }) {
  const {
    selectedDay,
    dayPlan,
    planLoading,
    generating,
    generatingStatus,
    genRetryAfter,
    loggingMeal,
    regeneratingCategory,
    swapRetryAfter,
    toast,
    isNotToday,
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
    handleGenerateDay,
    handleLogMeal,
    handleToggleItem,
    handleRegenerateCategory,
    dismissToast,
  } = useMealCalendar(onDaySelect);

  // ── Day content renderer ────────────────────────────────────────────────────

  function renderDayContent() {
    if (planLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
          <p className="text-xs font-semibold">Downloading daily healthy meal plan...</p>
        </div>
      );
    }

    if (!dayPlan?.meals?.length) {
      return (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#2d2d2d] bg-[#1a1a1a] text-slate-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold">Meal plan is empty</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">
            Click &ldquo;Recreate Today&rsquo;s Menu&rdquo; above to design your daily healthy menu plan.
          </p>
        </div>
      );
    }

    const sortedMeals = [...dayPlan.meals].sort(
      (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
    );

    return (
      <div className="space-y-4 pt-1 animate-fade-in">
        {dayPlan.total_calories > 0 && (
          <div className="flex justify-between items-center bg-[#1a1a1a] px-4 py-2 rounded-xl border border-[#2d2d2d]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Nutritional Plan Content
            </span>
            <span className="text-xs font-bold text-red-400 font-mono bg-red-950/20 px-2 py-0.5 rounded-md border border-red-900/20">
              ~{dayPlan.total_calories} kcal daily
            </span>
          </div>
        )}

        <div className="space-y-4">
          {sortedMeals.map((meal) => (
            <MealCard
              key={meal.meal_type}
              meal={meal}
              isNotToday={isNotToday}
              isLogging={loggingMeal === meal.meal_type}
              isRegenerating={regeneratingCategory === meal.meal_type}
              swapRetryAfter={swapRetryAfter}
              onLog={() => handleLogMeal(meal.meal_type)}
              onRegenerate={() => handleRegenerateCategory(meal.meal_type)}
              onToggleItem={handleToggleItem}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} onClose={dismissToast} />}

      <AiBannerCard
        title="KalaFit AI Nutrition Assistant"
        description="Formulate or recreate custom daily meal plans synchronized with your biological deficit or surplus target."
        buttonLabel="Recreate Today's Menu"
        onGenerate={handleGenerateDay}
        generating={generating}
        generatingLabel={generatingStatus || 'Formulating...'}
        retryAfter={genRetryAfter}
      />

      <DateSwitcher
        selectedDay={selectedDay}
        onPrev={handlePrevDay}
        onNext={handleNextDay}
        onGoToday={handleGoToToday}
        label="Active Meal Plan Date"
      />

      <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-2xl border border-[#2d2d2d] shadow-lux">
        <SectionHeader title={`Menu Details (${format(selectedDay, 'dd MMMM yyyy')})`} />
        {renderDayContent()}
      </div>
    </div>
  );
}
