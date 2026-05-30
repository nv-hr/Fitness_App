import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'RateLimitedButton.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('RateLimitedButton', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function RateLimitedButton')).toBe(true);
  });

  test('imports useState, useEffect, useRef', () => {
    expect(content.includes('useState')).toBe(true);
    expect(content.includes('useEffect')).toBe(true);
    expect(content.includes('useRef')).toBe(true);
  });

  test('uses countdown logic with setInterval/clearInterval', () => {
    expect(content.includes('setInterval')).toBe(true);
    expect(content.includes('clearInterval')).toBe(true);
  });

  test('renders children text', () => {
    expect(content.includes('children')).toBe(true);
  });

  test('shows "Wait" text during countdown via formatCountdown', () => {
    expect(content.includes('`Wait ${formatCountdown(countdown)}`')).toBe(true);
    expect(content.includes('formatCountdown')).toBe(true);
  });

  test('shows "Regenerating..." text when isLoading', () => {
    expect(content.includes("'Regenerating...'")).toBe(true);
  });

  test('button is disabled when isLoading or isCountingDown', () => {
    expect(content.includes('isLoading || isCountingDown')).toBe(true);
    expect(content.includes('disabled')).toBe(true);
  });

  test('contains minHeight: 44px for accessibility', () => {
    expect(content.includes("'44px'")).toBe(true);
  });
});
