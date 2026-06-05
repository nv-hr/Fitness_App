/**
 * AiBannerCard.jsx
 *
 * Why: The gradient AI-generator card with a "generate" button and rate-limit
 * countdown was duplicated between MealCalendarSection and
 * ActivityCalendarSection. Centralising it means rate-limit UX, copy, and
 * colour tweaks only need to happen in one place.
 */

import { Sparkles, RotateCw, Clock } from 'lucide-react';
import { formatCountdown } from '../lib/countdown.js';

/**
 * A gradient call-to-action card for AI-powered plan generation actions.
 * Handles generating state, rate-limit countdown display, and disabled state.
 *
 * @param {object}       props
 * @param {string}       props.title            - Card heading text.
 * @param {string}       props.description      - Subtitle / helper copy.
 * @param {string}       props.buttonLabel      - Primary button label when idle.
 * @param {Function}     props.onGenerate       - Callback when the generate button is clicked.
 * @param {boolean}      [props.generating]     - Whether a generation is in progress.
 * @param {string}       [props.generatingLabel='Generating...'] - Button label during generation.
 * @param {number|null}  [props.retryAfter]     - Seconds remaining in a rate-limit cooldown.
 * @returns {JSX.Element}
 */
export default function AiBannerCard({
  title,
  description,
  buttonLabel,
  onGenerate,
  generating = false,
  generatingLabel = 'Generating...',
  retryAfter = null,
}) {
  return (
    <div className="bg-gradient-to-r from-red-900/80 to-rose-900/60 p-5 rounded-2xl text-white border border-red-800/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Text content */}
      <div>
        <h3 className="font-display font-bold text-base flex items-center gap-1.5 leading-none">
          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
          {title}
        </h3>
        <p className="text-xs text-white/70 mt-1 max-w-md leading-relaxed">{description}</p>
      </div>

      {/* Action button */}
      <div className="sm:flex-shrink-0">
        {retryAfter != null && retryAfter > 0 ? (
          <button
            disabled
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 border border-white/10 text-white/60 font-bold text-xs rounded-xl cursor-not-allowed font-sans"
          >
            <Clock className="w-4 h-4" />
            Wait {formatCountdown(retryAfter)}
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#121212] hover:bg-[#1e1e1e] text-white border border-[#333] font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
          >
            {generating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                {generatingLabel}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {buttonLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
