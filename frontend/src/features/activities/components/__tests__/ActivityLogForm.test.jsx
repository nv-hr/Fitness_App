import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityLogForm from '../ActivityLogForm.jsx';

const mockActivity = {
  id: 1,
  name: 'Running',
  estimated_calories: 300,
  duration_min: 30,
};

describe('ActivityLogForm', () => {
  test('renders activity name in heading', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Log Activity: Running')).toBeInTheDocument();
  });

  test('has duration input of type number', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Duration (minutes)');
    expect(input).toHaveAttribute('type', 'number');
  });

  test('duration input has min=1 and max=1440', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Duration (minutes)');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '1440');
  });

  test('has intensity select element', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Intensity')).toBeInTheDocument();
    expect(screen.getByLabelText('Intensity').tagName).toBe('SELECT');
  });

  test('intensity options include Light, Moderate, Vigorous', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByLabelText('Intensity');
    expect(select).toContainHTML('value="light"');
    expect(select).toContainHTML('value="moderate"');
    expect(select).toContainHTML('value="vigorous"');
  });

  test('has date input of type date', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Date');
    expect(input).toHaveAttribute('type', 'date');
  });

  test('renders "Estimated calories burned" preview', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Estimated calories burned/)).toBeInTheDocument();
  });

  test('has "Log Activity" submit button and "Cancel" button', () => {
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Log Activity')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn();
    render(<ActivityLogForm activity={mockActivity} onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Log Activity'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<ActivityLogForm activity={mockActivity} onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
