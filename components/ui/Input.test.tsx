import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders label, helper text, and icon padding while honoring custom classes', () => {
    render(
      <Input
        label="名前"
        helperText="補足"
        required
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
        className="custom-input"
      />
    );

    expect(screen.getByText('名前')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();

    const helper = screen.getByText('補足');
    const input = screen.getByRole('textbox') as HTMLInputElement;

    expect(helper).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', helper.id);
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveClass('custom-input');
    expect(input.className).toContain('pl-10');
    expect(input.className).toContain('pr-10');
  });

  it('shows error text instead of helper text and applies error styling', () => {
    render(
      <Input
        id="email"
        label="メール"
        helperText="補足"
        error="必須"
        type="email"
      />
    );

    const input = screen.getByRole('textbox');

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.queryByText('補足')).toBeNull();
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('applies disabled styling and forwards readOnly attribute when disabled', () => {
    render(
      <Input label="パスワード" disabled readOnly className="extra" value="秘密" />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;

    expect(input).toBeDisabled();
    expect(input).toHaveProperty('readOnly', true);
    expect(input).toHaveClass('extra');
    expect(input).toHaveClass('cursor-not-allowed');
    expect(input).toHaveClass('opacity-60');
  });
});
