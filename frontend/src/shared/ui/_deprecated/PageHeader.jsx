/**
 * PageHeader.jsx
 *
 * Why: Nearly every feature page renders an `<h1>` + subtitle pair in the
 * same visual style. One component enforces the convention and reduces drift.
 */

/**
 * Page-level heading with an optional subtitle.
 *
 * @param {object} props
 * @param {string} props.title      - The main page heading (rendered as h1).
 * @param {string} [props.subtitle] - Optional supporting text displayed below the title.
 * @returns {JSX.Element}
 */
function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}
