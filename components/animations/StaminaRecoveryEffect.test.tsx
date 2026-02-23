import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  StaminaRecoveryEffect,
  StaminaFullRecoveryEffect,
} from './StaminaRecoveryEffect';

vi.mock('framer-motion', () => {
  const MotionDiv = ({ children, ...props }: Record<string, unknown>) => {
    const {
      initial,
      animate,
      exit,
      transition,
      layout,
      whileHover,
      whileTap,
      ...domProps
    } = props;
    return <div {...domProps}>{children as ReactNode}</div>;
  };

  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

describe('StaminaRecoveryEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders recovered amount and stamina pair', () => {
    render(
      <StaminaRecoveryEffect
        recoveredAmount={10}
        currentStamina={40}
        maxStamina={100}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('スタミナ回復')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('(40/100)')).toBeInTheDocument();
  });

  it('supports position variants', () => {
    const { container, rerender } = render(
      <StaminaRecoveryEffect
        recoveredAmount={5}
        currentStamina={20}
        maxStamina={100}
        onComplete={vi.fn()}
        position="center"
      />
    );
    expect(container.firstChild).toHaveClass('top-1/2');

    rerender(
      <StaminaRecoveryEffect
        recoveredAmount={5}
        currentStamina={20}
        maxStamina={100}
        onComplete={vi.fn()}
        position="bottom"
      />
    );
    expect(container.firstChild).toHaveClass('bottom-20');
  });

  it('calls onComplete after timeout', () => {
    const onComplete = vi.fn();

    render(
      <StaminaRecoveryEffect
        recoveredAmount={10}
        currentStamina={40}
        maxStamina={100}
        onComplete={onComplete}
      />
    );

    vi.advanceTimersByTime(2000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('StaminaFullRecoveryEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders full recovery message', () => {
    render(<StaminaFullRecoveryEffect onComplete={vi.fn()} />);

    expect(screen.getByText('スタミナ全回復！')).toBeInTheDocument();
    expect(screen.getByText('新しいタスクに挑戦しよう')).toBeInTheDocument();
  });

  it('calls onComplete after timeout', () => {
    const onComplete = vi.fn();

    render(<StaminaFullRecoveryEffect onComplete={onComplete} />);

    vi.advanceTimersByTime(2500);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
