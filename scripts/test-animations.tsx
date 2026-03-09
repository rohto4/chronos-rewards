/**
 * アニメーションコンポーネントテストスクリプト
 * 
 * Phase 5のアニメーションコンポーネントの動作確認
 * - RewardAnimation
 * - LevelUpAnimation
 * - StaminaRecoveryEffect
 * 
 * 実行: npm run test:animations
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RewardAnimation } from '@/components/animations/RewardAnimation';
import { LevelUpAnimation } from '@/components/animations/LevelUpAnimation';
import { StaminaRecoveryEffect } from '@/components/animations/StaminaRecoveryEffect';

const createMotionComponent = <T extends keyof JSX.IntrinsicElements>(tag: T) =>
  React.forwardRef<HTMLElement, JSX.IntrinsicElements[T]>(({ children, ...props }, ref) =>
    React.createElement(tag, { ...props, ref }, children)
  );

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy(
    {} as Record<string, React.ForwardRefExoticComponent<any>>,
    {
      get: (_, property) => {
        const tag = property.toString() as keyof JSX.IntrinsicElements;
        if (!tag) {
          return createMotionComponent('div');
        }
        return createMotionComponent(tag);
      },
    }
  );

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('Animation Components - Phase 5', () => {
  describe('RewardAnimation', () => {
    it('コイン獲得アニメーションが表示される', () => {
      const onComplete = vi.fn();
      
      render(
        <RewardAnimation
          type="coin"
          amount={100}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('コイン獲得！')).toBeInTheDocument();
      expect(screen.getByText('+100')).toBeInTheDocument();
    });

    it('クリスタル獲得アニメーションが表示される', () => {
      const onComplete = vi.fn();
      
      render(
        <RewardAnimation
          type="crystal"
          amount={50}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('クリスタル獲得！')).toBeInTheDocument();
      expect(screen.getByText('+50')).toBeInTheDocument();
    });

    it('レベルアップアニメーションが表示される', () => {
      const onComplete = vi.fn();
      
      render(
        <RewardAnimation
          type="levelup"
          level={5}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('レベルアップ！')).toBeInTheDocument();
      expect(screen.getByText('Lv.5')).toBeInTheDocument();
    });

    it('親タスク完了アニメーションが表示される', () => {
      const onComplete = vi.fn();
      
      render(
        <RewardAnimation
          type="parent-complete"
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('親タスク完了！')).toBeInTheDocument();
    });

    it('アニメーション完了後にコールバックが呼ばれる', async () => {
      const onComplete = vi.fn();
      
      render(
        <RewardAnimation
          type="coin"
          amount={100}
          onComplete={onComplete}
        />
      );

      // 2.5秒後にコールバックが呼ばれる
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('LevelUpAnimation', () => {
    it('レベルアップ演出が表示される', () => {
      const onComplete = vi.fn();
      
      render(
        <LevelUpAnimation
          newLevel={10}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('LEVEL UP!')).toBeInTheDocument();
      expect(screen.getByText('Lv. 10')).toBeInTheDocument();
    });

    it('報酬情報が表示される', async () => {
      const onComplete = vi.fn();
      const rewards = {
        coins: 500,
        crystals: 100,
        maxStamina: 10,
      };
      
      render(
        <LevelUpAnimation
          newLevel={10}
          rewards={rewards}
          onComplete={onComplete}
        />
      );

      // 報酬は1.5秒後に表示される
      await waitFor(
        () => {
          expect(screen.getByText('獲得報酬')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      expect(screen.getByText(/\+500/)).toBeInTheDocument();
      expect(screen.getByText(/\+100/)).toBeInTheDocument();
      expect(screen.getAllByText(/\+10/).length).toBeGreaterThan(0);
    });

    it('アニメーション完了後にコールバックが呼ばれる', async () => {
      const onComplete = vi.fn();
      
      render(
        <LevelUpAnimation
          newLevel={5}
          onComplete={onComplete}
        />
      );

      // 4秒後にコールバックが呼ばれる
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('StaminaRecoveryEffect', () => {
    it('スタミナ回復通知が表示される', () => {
      const onComplete = vi.fn();
      
      render(
        <StaminaRecoveryEffect
          recoveredAmount={10}
          currentStamina={50}
          maxStamina={100}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('スタミナ回復')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('(50/100)')).toBeInTheDocument();
    });

    it('表示位置を指定できる', () => {
      const onComplete = vi.fn();
      
      const { container: topContainer } = render(
        <StaminaRecoveryEffect
          recoveredAmount={5}
          currentStamina={50}
          maxStamina={100}
          onComplete={onComplete}
          position="top"
        />
      );

      expect(topContainer.querySelector('.top-20')).toBeInTheDocument();
    });

    it('アニメーション完了後にコールバックが呼ばれる', async () => {
      const onComplete = vi.fn();
      
      render(
        <StaminaRecoveryEffect
          recoveredAmount={10}
          currentStamina={50}
          maxStamina={100}
          onComplete={onComplete}
        />
      );

      // 2秒後にコールバックが呼ばれる
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });
});

/**
 * テスト実行前の設定
 */
beforeAll(() => {
  console.log('🧪 アニメーションコンポーネントテスト開始');
});

/**
 * テスト実行後の設定
 */
afterAll(() => {
  console.log('✅ アニメーションコンポーネントテスト完了');
});
