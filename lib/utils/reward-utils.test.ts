/**
 * reward-utils.ts のテスト
 *
 * 報酬計算ロジックの正確性を検証
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDetailLevel,
  calculateCoinReward,
  calculateCrystalReward,
  calculateTaskCreateStaminaCost,
  getTaskEditStaminaCost,
  calculateStaminaRecovery,
  isStaminaInsufficient,
  getStaminaPercentage,
  getStaminaStatus,
  calculateEditBonusCoin,
  getTaskBonusFlags,
} from './reward-utils';
import type { Task, TaskChecklistItem } from '@/types/database';

describe('reward-utils', () => {
  describe('calculateDetailLevel', () => {
    it('最小詳細度は1', () => {
      const task: Partial<Task> = {};
      expect(calculateDetailLevel(task)).toBe(1);
    });

    it('説明文が10文字以上で+1', () => {
      const task: Partial<Task> = {
        description: '1234567890', // 10文字
      };
      expect(calculateDetailLevel(task)).toBe(2);
    });

    it('メリットが10文字以上で+1', () => {
      const task: Partial<Task> = {
        benefits: '1234567890', // 10文字
      };
      expect(calculateDetailLevel(task)).toBe(2);
    });

    it('チェックリストが3個以上で+1', () => {
      const task: Partial<Task> = {};
      const checklist: TaskChecklistItem[] = [
        { id: '1', task_id: 'task1', item_text: 'item1', is_checked: false, display_order: 0, created_at: '', updated_at: '' },
        { id: '2', task_id: 'task1', item_text: 'item2', is_checked: false, display_order: 1, created_at: '', updated_at: '' },
        { id: '3', task_id: 'task1', item_text: 'item3', is_checked: false, display_order: 2, created_at: '', updated_at: '' },
      ];
      expect(calculateDetailLevel(task, checklist)).toBe(2);
    });

    it('推定時間が10時間以上で+1', () => {
      const task: Partial<Task> = {
        estimated_hours: 10,
      };
      expect(calculateDetailLevel(task)).toBe(2);
    });

    it('すべての条件を満たすと最大詳細度5', () => {
      const task: Partial<Task> = {
        description: '詳細な説明文です。これは10文字以上あります。',
        benefits: 'メリット文です。これも10文字以上あります。',
        estimated_hours: 15,
      };
      const checklist: TaskChecklistItem[] = [
        { id: '1', task_id: 'task1', item_text: 'item1', is_checked: false, display_order: 0, created_at: '', updated_at: '' },
        { id: '2', task_id: 'task1', item_text: 'item2', is_checked: false, display_order: 1, created_at: '', updated_at: '' },
        { id: '3', task_id: 'task1', item_text: 'item3', is_checked: false, display_order: 2, created_at: '', updated_at: '' },
      ];
      expect(calculateDetailLevel(task, checklist)).toBe(5);
    });
  });

  describe('calculateCoinReward', () => {
    it('詳細度1、ボーナスなしで基本コイン', () => {
      const reward = calculateCoinReward(1, false, false);
      expect(reward).toBeGreaterThan(0);
    });

    it('詳細度が高いほど報酬が増加', () => {
      const reward1 = calculateCoinReward(1, false, false);
      const reward5 = calculateCoinReward(5, false, false);
      expect(reward5).toBeGreaterThan(reward1);
    });

    it('前提条件ボーナスで報酬が増加', () => {
      const withoutBonus = calculateCoinReward(3, false, false);
      const withBonus = calculateCoinReward(3, true, false);
      expect(withBonus).toBeGreaterThan(withoutBonus);
    });

    it('メリットボーナスで報酬が増加', () => {
      const withoutBonus = calculateCoinReward(3, false, false);
      const withBonus = calculateCoinReward(3, false, true);
      expect(withBonus).toBeGreaterThan(withoutBonus);
    });

    it('両方のボーナスで最大報酬', () => {
      const noBonus = calculateCoinReward(5, false, false);
      const fullBonus = calculateCoinReward(5, true, true);
      expect(fullBonus).toBeGreaterThan(noBonus);
    });
  });

  describe('calculateCrystalReward', () => {
    it('推定時間に応じてクリスタルが増加', () => {
      const reward5h = calculateCrystalReward(5, false, false, false);
      const reward10h = calculateCrystalReward(10, false, false, false);
      expect(reward10h).toBeGreaterThan(reward5h);
    });

    it('前提条件ボーナスで報酬が増加', () => {
      const withoutBonus = calculateCrystalReward(5, false, false, false);
      const withBonus = calculateCrystalReward(5, true, false, false);
      expect(withBonus).toBeGreaterThan(withoutBonus);
    });

    it('メリットボーナスで報酬が増加', () => {
      const withoutBonus = calculateCrystalReward(5, false, false, false);
      const withBonus = calculateCrystalReward(5, false, true, false);
      expect(withBonus).toBeGreaterThan(withoutBonus);
    });

    it('親タスクボーナスで大幅に報酬が増加', () => {
      const childTask = calculateCrystalReward(5, false, false, false);
      const parentTask = calculateCrystalReward(5, false, false, true);
      expect(parentTask).toBeGreaterThan(childTask);
    });
  });

  describe('calculateTaskCreateStaminaCost', () => {
    it('基本コストが返される', () => {
      const cost = calculateTaskCreateStaminaCost(false, false);
      expect(cost).toBeGreaterThan(0);
    });

    it('前提条件ありでコストが増加', () => {
      const baseCost = calculateTaskCreateStaminaCost(false, false);
      const withPrerequisite = calculateTaskCreateStaminaCost(true, false);
      expect(withPrerequisite).toBeGreaterThan(baseCost);
    });

    it('メリットありでコストが増加', () => {
      const baseCost = calculateTaskCreateStaminaCost(false, false);
      const withBenefit = calculateTaskCreateStaminaCost(false, true);
      expect(withBenefit).toBeGreaterThan(baseCost);
    });
  });

  describe('getTaskEditStaminaCost', () => {
    it('編集コストが返される', () => {
      const cost = getTaskEditStaminaCost();
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateStaminaRecovery', () => {
    it('経過時間に応じてスタミナが回復', () => {
      const recovered = calculateStaminaRecovery(1, 50);
      expect(recovered).toBeGreaterThan(50);
    });

    it('最大スタミナを超えない', () => {
      const recovered = calculateStaminaRecovery(100, 90);
      expect(recovered).toBeLessThanOrEqual(100);
    });

    it('経過時間0では回復しない', () => {
      const recovered = calculateStaminaRecovery(0, 50);
      expect(recovered).toBe(50);
    });
  });

  describe('isStaminaInsufficient', () => {
    it('スタミナ不足を正しく判定', () => {
      expect(isStaminaInsufficient(10, 20)).toBe(true);
      expect(isStaminaInsufficient(20, 10)).toBe(false);
      expect(isStaminaInsufficient(15, 15)).toBe(false);
    });
  });

  describe('getStaminaPercentage', () => {
    it('割合を正しく計算', () => {
      expect(getStaminaPercentage(50, 100)).toBe(50);
      expect(getStaminaPercentage(0, 100)).toBe(0);
      expect(getStaminaPercentage(100, 100)).toBe(100);
    });

    it('小数点以下を切り捨て', () => {
      expect(getStaminaPercentage(33, 100)).toBe(33);
    });
  });

  describe('getStaminaStatus', () => {
    it('低スタミナ（25%以下）を判定', () => {
      expect(getStaminaStatus(25)).toBe('low');
      expect(getStaminaStatus(10)).toBe('low');
    });

    it('中スタミナ（26-60%）を判定', () => {
      expect(getStaminaStatus(50)).toBe('medium');
      expect(getStaminaStatus(60)).toBe('medium');
    });

    it('高スタミナ（61%以上）を判定', () => {
      expect(getStaminaStatus(61)).toBe('high');
      expect(getStaminaStatus(100)).toBe('high');
    });
  });

  describe('calculateEditBonusCoin', () => {
    it('詳細度向上でボーナスが発生', () => {
      const bonus = calculateEditBonusCoin(2, 4);
      expect(bonus).toBeGreaterThan(0);
    });

    it('詳細度が下がるとボーナスなし', () => {
      const bonus = calculateEditBonusCoin(4, 2);
      expect(bonus).toBe(0);
    });

    it('詳細度が同じならボーナスなし', () => {
      const bonus = calculateEditBonusCoin(3, 3);
      expect(bonus).toBe(0);
    });
  });

  describe('getTaskBonusFlags', () => {
    it('チェックリストがある場合、前提条件フラグがtrue', () => {
      const task: Partial<Task> = {};
      const checklist: TaskChecklistItem[] = [
        { id: '1', task_id: 'task1', item_text: 'item1', is_checked: false, display_order: 0, created_at: '', updated_at: '' },
      ];
      const flags = getTaskBonusFlags(task, checklist);
      expect(flags.hasPrerequisite).toBe(true);
    });

    it('メリットがある場合、メリットフラグがtrue', () => {
      const task: Partial<Task> = {
        benefits: 'メリットあり',
      };
      const flags = getTaskBonusFlags(task);
      expect(flags.hasBenefit).toBe(true);
    });

    it('どちらもない場合、両方false', () => {
      const task: Partial<Task> = {};
      const flags = getTaskBonusFlags(task);
      expect(flags.hasPrerequisite).toBe(false);
      expect(flags.hasBenefit).toBe(false);
    });
  });
});
