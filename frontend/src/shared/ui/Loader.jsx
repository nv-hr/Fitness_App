/**
 * Loader.jsx
 *
 * Why: A single, reusable full-screen-center loading indicator used across
 * auth guards, profile checks, and data-fetch states. Centralising it
 * prevents inconsistent spinner implementations scattered through Router.jsx
 * and individual feature pages.
 */

/**
 * Displays a centred animated spinner with an optional message.
 *
 * @param {object} props
 * @param {string} [props.message='Loading...'] - Text shown below the spinner.
 * @returns {JSX.Element}
 */
export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="absolute w-6 h-6 bg-emerald-100 rounded-full animate-ping opacity-75" />
      </div>
      <p className="mt-5 text-slate-500 text-sm font-medium tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}
