/**
 * FormField.jsx
 *
 * Why: Every form in the app wraps inputs in: label → icon-prefix container →
 * input → error message. This helper removes that repeated boilerplate,
 * making form markup scannable.
 */

/**
 * A form field wrapper: label, optional leading icon, input/select slot, and error text.
 *
 * @param {object}          props
 * @param {string}          props.label     - The visible field label.
 * @param {string}          props.id        - Passed as `htmlFor` on the label.
 * @param {string}          [props.error]   - Validation error text to display below the input.
 * @param {React.ReactNode} [props.icon]    - Optional icon element placed at the left of the input.
 * @param {React.ReactNode} props.children  - The actual input/select element.
 * @returns {JSX.Element}
 */
export default function FormField({ label, id, error, icon, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>

      {icon ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            {icon}
          </div>
          <div className="[&>*]:pl-10">{children}</div>
        </div>
      ) : (
        children
      )}

      {error && (
        <p className="text-rose-500 text-xs mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}
