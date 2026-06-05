/**
 * SectionHeader.jsx
 *
 * Why: The pattern of `<h3>` with a small coloured left-bar accent and an
 * optional right-side slot recurs across feature pages. One component keeps
 * the visual language consistent without copy-paste.
 */

/**
 * A section heading with a coloured left-bar accent and an optional right slot.
 *
 * @param {object}      props
 * @param {string}      props.title     - The heading text.
 * @param {React.ReactNode} [props.children] - Optional content rendered to the right of the title.
 * @returns {JSX.Element}
 */
export default function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold text-base text-white flex items-center gap-1.5">
        <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block" />
        {title}
      </h3>
      {children && <div>{children}</div>}
    </div>
  );
}
