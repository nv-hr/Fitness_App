import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'ActivityLogForm.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('ActivityLogForm', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function ActivityLogForm')).toBe(true);
  });

  test('renders "Log Activity" heading with activity name', () => {
    expect(content.includes("'Log Activity'")).toBe(true);
    expect(content.includes('activity.name')).toBe(true);
  });

  test('imports calculateActivityCalories for preview', () => {
    expect(content.includes('calculateActivityCalories')).toBe(true);
  });

  test('has duration input[type=number]', () => {
    expect(content.includes("type=\"number\"")).toBe(true);
  });

  test('has intensity select element', () => {
    expect(content.includes('<select')).toBe(true);
  });

  test('has date input[type=date]', () => {
    expect(content.includes("type=\"date\"")).toBe(true);
  });

  test('renders "Estimated calories burned" preview text', () => {
    expect(content.includes("'Estimated calories burned'")).toBe(true);
  });

  test('has "Log Activity" submit button and "Cancel" button', () => {
    expect(content.includes("'Log Activity'")).toBe(true);
    expect(content.includes("'Cancel'")).toBe(true);
  });

  test('submit button is disabled when submitting', () => {
    expect(content.includes('submitting')).toBe(true);
    expect(content.includes('disabled')).toBe(true);
  });

  test('form has onSubmit handler that calls preventDefault', () => {
    expect(content.includes('onSubmit')).toBe(true);
    expect(content.includes('preventDefault')).toBe(true);
  });

  test('duration validation includes min=1, max=1440', () => {
    expect(content.includes('min="1"')).toBe(true);
    expect(content.includes('max="1440"')).toBe(true);
  });

  test('intensity options include light, moderate, vigorous', () => {
    expect(content.includes('"light"')).toBe(true);
    expect(content.includes('"moderate"')).toBe(true);
    expect(content.includes('"vigorous"')).toBe(true);
  });
});
