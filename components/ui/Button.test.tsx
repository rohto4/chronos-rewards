import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('shows rightIcon while loading but leaves leftIcon hidden', () => {
    render(
      <Button
        isLoading
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        保存
      </Button>
    );

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
  });
});
