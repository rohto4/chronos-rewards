import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders helper text and a character counter when showCount is enabled and maxLength is provided', () => {
    render(
      <Textarea
        label="詳細"
        helperText="補足"
        showCount
        maxLength={10}
        value="abc"
        onChange={() => {}}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(screen.getByText('補足')).toBeInTheDocument();
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('maxLength', '10');
    expect(textarea.value).toBe('abc');
  });

  it('shows the error message instead of helper text and applies error styling', () => {
    render(
      <Textarea
        label="備考"
        helperText="裏書"
        error="入力エラー"
      />
    );

    const textarea = screen.getByRole('textbox');

    expect(screen.getByText('入力エラー')).toBeInTheDocument();
    expect(screen.queryByText('裏書')).toBeNull();
    expect(textarea).toHaveClass('border-red-500');
  });

  it('disables the textarea and skips the counter when maxLength is absent even if showCount is true', () => {
    render(
      <Textarea
        label="コメント"
        showCount
        disabled
        className="extra-textarea"
        defaultValue=""
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('extra-textarea');
    expect(textarea).toHaveClass('cursor-not-allowed');
    expect(textarea).toHaveClass('opacity-60');
    expect(textarea).not.toHaveAttribute('maxLength');
    expect(screen.queryByText(/\d+ \//)).toBeNull();
  });

  it('shows the required indicator when the required prop is true', () => {
    render(
      <Textarea
        label="必須"
        required
        value=""
        onChange={() => {}}
      />
    );

    const labelElement = screen.getByText('必須', { selector: 'label' });
    expect(within(labelElement).getByText('*')).toBeInTheDocument();
  });

  it('does not render the required indicator when required is false', () => {
    render(
      <Textarea
        label="任意"
        required={false}
        value=""
        onChange={() => {}}
      />
    );

    const labelElement = screen.getByText('任意', { selector: 'label' });
    expect(within(labelElement).queryByText('*')).toBeNull();
  });
});
