/**
 * index.js — Public API for the dashboard feature.
 *
 * Why: Keeps import paths short for consumers. The router imports
 * `DashboardPage` from here, not from the nested component path.
 */

export { default as DashboardPage } from './components/DashboardPage.jsx';
