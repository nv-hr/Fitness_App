import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'FallbackBanner.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('FallbackBanner', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function FallbackBanner')).toBe(true);
  });

  test('returns null for status "active"', () => {
    expect(content.includes("status !== 'fallback'")).toBe(true);
    expect(content.includes("status !== 'unavailable'")).toBe(true);
    expect(content.includes("return null")).toBe(true);
  });

  test('renders fallback message for status "fallback"', () => {
    expect(content.includes("status === 'fallback'")).toBe(true);
    expect(content.includes('backup plan')).toBe(true);
  });

  test('renders unavailable message for users with no history', () => {
    expect(content.includes('No activity history available')).toBe(true);
  });

  test('returns null for null status check', () => {
    expect(content.includes("status !== 'fallback'")).toBe(true);
  });

  test('uses amber/yellow background colors', () => {
    expect(content.includes("'#fffbeb'")).toBe(true);
    expect(content.includes("'1px solid #fde68a'")).toBe(true);
  });
});
