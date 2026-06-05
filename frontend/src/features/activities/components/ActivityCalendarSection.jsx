/**
 * ActivityCalendarSection.jsx
 *
 * Why: Previously 453 lines mixing UI, API calls, countdown timers, and
 * toast state. Now an orchestrator (~90 lines) that delegates:
 *  - All state & API logic → useActivityCalendar hook
 *  - Shared widgets        → AiBannerCard, DateSwitcher, SectionHeader, Toast
 *  - Per-activity rows     → DayActivityRow
 */

import { format } from 'date-fns';
import { useActivityCalendar } from '../hooks/useActivityCalendar.js';
import DayActivityRow from './DayActivityRow.jsx';
import { AiBannerCard, DateSwitcher, SectionHeader, Toast } from '../../../shared/ui/index.js';
import { RotateCw, Info } from 'lucide-react';

/**
 * The weekly activity plan section: AI generation banner, date switcher,
 * and a list of activity rows for the selected day.
 *
 * @param {object}   [props]
 * @param {Function} [props.onDaySelect]   - Optional callback when the active day changes.
 * @param {Function} [props.onMonthChange] - Optional callback when the visible month changes.
 * @param {object}   [props.dayStatusMap]  - Map of date string → status, used by parent calendar.
 * @returns {JSX.Element}
 */
export default function ActivityCalendarSection({ onDaySelect, onMonthChange, dayStatusMap }) {
  const {
    selectedDay,
    dayPlan,
    planLoading,
    generating,
    genRetryAfter,
    swappingActivityId,
    swapRetryAfter,
    completedActivities,
    toast,
    isNotToday,
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
    handleGenerateWeek,
    handleSwap,
    handleToggleComplete,
    dismissToast,
  } = useActivityCalendar(onDaySelect, onMonthChange);

  // ── Day content renderer ────────────────────────────────────────────────────

  function renderDayContent() {
    if (planLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
          <RotateCw className="w-6 h-6 animate-spin text-red-500" />
          <p className="text-xs font-semibold">Downloading daily healthy activity plan...</p>
        </div>
      );
    }

    if (dayPlan?.activities?.length > 0) {
      return (
        <div className="space-y-1 animate-fade-in">
          {dayPlan.activities.map((activity) => (
            <DayActivityRow
              key={activity.activity_id}
              activity={activity}
              onSwap={
                isNotToday
                  ? undefined
                  : () => handleSwap(activity.activity_id, (selectedDay.getDay() + 6) % 7)
              }
              onToggle={
                isNotToday
                  ? undefined
                  : () =>
                      handleToggleComplete(
                        activity.activity_id,
                        (selectedDay.getDay() + 6) % 7,
                        completedActivities.has(activity.activity_id)
                      )
              }
              disabled={isNotToday}
              completed={completedActivities.has(activity.activity_id)}
              isSwapping={swappingActivityId === activity.activity_id}
              swapRetryAfter={swapRetryAfter}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#2d2d2d] bg-[#1a1a1a] text-slate-500">
        <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-semibold">
          {dayPlan?.rest_day
            ? 'Rest Day — Your muscles need recovery today.'
            : 'No workouts scheduled for this date.'}
        </p>
        <p className="text-xs mt-1 max-w-xs mx-auto">
          Click &ldquo;Recreate Weekly Plan&rdquo; above to generate workout targets.
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} onClose={dismissToast} />}

      <AiBannerCard
        title="KalaFit AI Workout Assistant"
        description="Formulate or recreate custom fitness targets. The adaptive plan will automatically customize your biologic exercise intensities."
        buttonLabel="Recreate Weekly Plan"
        onGenerate={handleGenerateWeek}
        generating={generating}
        generatingLabel="Designing..."
        retryAfter={genRetryAfter}
      />

      <DateSwitcher
        selectedDay={selectedDay}
        onPrev={handlePrevDay}
        onNext={handleNextDay}
        onGoToday={handleGoToToday}
        label="Active Workout Date"
      />

      <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-2xl border border-[#2d2d2d] shadow-lux">
        <SectionHeader title={`Workout Details (${format(selectedDay, 'dd MMMM yyyy')})`} />
        {renderDayContent()}
      </div>
    </div>
  );
}
