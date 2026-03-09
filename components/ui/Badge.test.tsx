import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders a blue dot for the primary variant', () => {
    const { container } = render(
      <Badge variant="primary" dot>
        状態
      </Badge>
    );

    const dot = container.querySelector('.bg-blue-600');
    expect(dot).toBeInTheDocument();
    if (!dot) throw new Error('dot not found');
    expect(dot).toHaveClass('w-1.5', 'h-1.5', 'mr-1.5', 'rounded-full');
  });

  it('renders a purple dot for the purple variant', () => {
    const { container } = render(
      <Badge variant="purple" dot>
        特別
      </Badge>
    );

    const dot = container.querySelector('.bg-purple-600');
    expect(dot).toBeInTheDocument();
    if (!dot) throw new Error('dot not found');
    expect(dot).toHaveClass('w-1.5', 'h-1.5', 'mr-1.5', 'rounded-full');
  });
});
