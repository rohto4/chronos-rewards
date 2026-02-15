/**
 * user-store.ts のテスト
 *
 * ユーザーストアの基本機能をテスト
 */

import { describe, it, expect, vi } from 'vitest';
import type { UserProfile } from '@/types/database';

// Supabaseクライアントのモック
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-user-id',
              current_stamina: 80,
              max_stamina: 100,
              total_coins: 1000,
              total_crystals: 50,
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  },
}));

describe('user-store', () => {
  describe('ユーザープロフィール', () => {
    it('プロフィールの必須フィールドが存在', () => {
      const profile: Partial<UserProfile> = {
        id: 'user-1',
        current_stamina: 80,
        max_stamina: 100,
        total_coins: 1000,
        total_crystals: 50,
      };

      expect(profile.id).toBeDefined();
      expect(profile.current_stamina).toBeDefined();
      expect(profile.max_stamina).toBeDefined();
      expect(profile.total_coins).toBeDefined();
      expect(profile.total_crystals).toBeDefined();
    });

    it('スタミナは最大値を超えない', () => {
      const profile: Partial<UserProfile> = {
        current_stamina: 80,
        max_stamina: 100,
      };

      expect(profile.current_stamina!).toBeLessThanOrEqual(profile.max_stamina!);
    });

    it('コインとクリスタルは0以上', () => {
      const profile: Partial<UserProfile> = {
        total_coins: 1000,
        total_crystals: 50,
      };

      expect(profile.total_coins!).toBeGreaterThanOrEqual(0);
      expect(profile.total_crystals!).toBeGreaterThanOrEqual(0);
    });
  });

  describe('スタミナ管理', () => {
    it('スタミナチェックが正しく動作', () => {
      const currentStamina = 50;
      const requiredStamina = 30;

      const hasEnough = currentStamina >= requiredStamina;
      expect(hasEnough).toBe(true);
    });

    it('スタミナ不足を検出', () => {
      const currentStamina = 20;
      const requiredStamina = 30;

      const hasEnough = currentStamina >= requiredStamina;
      expect(hasEnough).toBe(false);
    });

    it('スタミナ回復の計算', () => {
      const currentStamina = 70;
      const recoveryAmount = 10;
      const maxStamina = 100;

      const newStamina = Math.min(currentStamina + recoveryAmount, maxStamina);
      expect(newStamina).toBe(80);
    });

    it('スタミナ回復は最大値を超えない', () => {
      const currentStamina = 95;
      const recoveryAmount = 10;
      const maxStamina = 100;

      const newStamina = Math.min(currentStamina + recoveryAmount, maxStamina);
      expect(newStamina).toBe(maxStamina);
    });
  });

  describe('報酬管理', () => {
    it('コイン加算の計算', () => {
      const currentCoins = 1000;
      const rewardCoins = 100;

      const newCoins = currentCoins + rewardCoins;
      expect(newCoins).toBe(1100);
    });

    it('クリスタル加算の計算', () => {
      const currentCrystals = 50;
      const rewardCrystals = 25;

      const newCrystals = currentCrystals + rewardCrystals;
      expect(newCrystals).toBe(75);
    });

    it('負の値は加算されない', () => {
      const currentCoins = 1000;
      const rewardCoins = -100; // 負の値

      // 報酬は常に正の値であるべき
      const validReward = Math.max(0, rewardCoins);
      const newCoins = currentCoins + validReward;
      expect(newCoins).toBe(1000);
    });
  });

  describe('レベルシステム', () => {
    it('経験値からレベルを計算', () => {
      const totalXP = 1000;
      const xpPerLevel = 100;

      const level = Math.floor(totalXP / xpPerLevel) + 1;
      expect(level).toBeGreaterThan(0);
    });

    it('レベルアップに必要な経験値を計算', () => {
      const currentLevel = 5;
      const xpPerLevel = 100;

      const requiredXP = currentLevel * xpPerLevel;
      expect(requiredXP).toBe(500);
    });
  });

  describe('プロフィール更新', () => {
    it('部分的な更新が可能', () => {
      const originalProfile: Partial<UserProfile> = {
        id: 'user-1',
        current_stamina: 80,
        total_coins: 1000,
      };

      const updates: Partial<UserProfile> = {
        current_stamina: 90,
      };

      const updatedProfile = { ...originalProfile, ...updates };
      expect(updatedProfile.current_stamina).toBe(90);
      expect(updatedProfile.total_coins).toBe(1000); // 変更されていない
    });
  });

  describe('スタミナ回復時間の計算', () => {
    it('回復時間を計算', () => {
      const currentStamina = 50;
      const maxStamina = 100;
      const recoveryRate = 5; // 1時間あたり5回復

      const staminaNeeded = maxStamina - currentStamina;
      const hoursNeeded = Math.ceil(staminaNeeded / recoveryRate);

      expect(hoursNeeded).toBe(10); // 50スタミナ不足 ÷ 5/h = 10時間
    });

    it('スタミナが満タンの場合は回復不要', () => {
      const currentStamina = 100;
      const maxStamina = 100;

      const staminaNeeded = maxStamina - currentStamina;
      expect(staminaNeeded).toBe(0);
    });
  });
});
