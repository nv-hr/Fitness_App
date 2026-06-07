/**
 * index.js — Barrel export for all shared UI components.
 *
 * Why: A single import point means consumers never need to know the exact
 * file path of each component. Adding a new shared component only requires
 * updating this file.
 */

export { default as Loader }        from './Loader.jsx';
export { default as Toast }         from './Toast.jsx';
export { default as DateSwitcher }  from './DateSwitcher.jsx';
export { default as AiBannerCard }  from './AiBannerCard.jsx';
export { default as SectionHeader } from './SectionHeader.jsx';
export { default as PageHeader }    from './PageHeader.jsx';
export { default as FormField }     from './FormField.jsx';
export { default as DayActivityRow } from './DayActivityRow.jsx';
