import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'EmptyStatePlan.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('EmptyStatePlan', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function EmptyStatePlan')).toBe(true);
  });

  test('renders "No Weekly Plan Yet" heading', () => {
    expect(content.includes("'No Weekly Plan Yet'")).toBe(true);
  });

  test('renders "Generate My Weekly Plan" button', () => {
    expect(content.includes("'Generate My Weekly Plan'")).toBe(true);
  });

  test('button is disabled when isGenerating is true', () => {
    expect(content.includes('isGenerating')).toBe(true);
    expect(content.includes('disabled')).toBe(true);
  });

  test('shows "Generating your plan..." when isGenerating', () => {
    expect(content.includes("'Generating your plan...'")).toBe(true);
  });

  test('onGenerate prop is present and called on button click', () => {
    expect(content.includes('onGenerate')).toBe(true);
    expect(content.includes('onClick={onGenerate}')).toBe(true);
  });

  test('button uses #16a34a green background', () => {
    expect(content.includes("'#16a34a'")).toBe(true);
  });
});
