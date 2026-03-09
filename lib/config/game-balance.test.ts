import { describe, expect, it } from 'vitest';

import {
  COIN_CONFIG,
  CRYSTAL_CONFIG,
  STAMINA_CONFIG,
  DETAIL_LEVEL_CONFIG,
  simulateCoinReward,
  simulateCrystalReward,
  simulateStaminaRecovery,
} from './game-balance';

describe('game-balance config', () => {
  it('exposes expected coin constants', () => {
    expect(COIN_CONFIG.BASE_COIN).toBe(10);
    expect(COIN_CONFIG.DETAIL_MULTIPLIER_STEP).toBe(0.25);
    expect(COIN_CONFIG.PREREQUISITE_BONUS).toBe(1.2);
    expect(COIN_CONFIG.BENEFIT_BONUS).toBe(1.2);
    expect(COIN_CONFIG.EDIT_BONUS_PER_LEVEL).toBe(5);
  });

  it('exposes expected crystal constants', () => {
    expect(CRYSTAL_CONFIG.BASE_CRYSTAL_PER_HOUR).toBe(5);
    expect(CRYSTAL_CONFIG.PREREQUISITE_BONUS).toBe(1.2);
    expect(CRYSTAL_CONFIG.BENEFIT_BONUS).toBe(1.2);
    expect(CRYSTAL_CONFIG.PARENT_TASK_BONUS).toBe(3);
  });

  it('exposes expected stamina and detail constants', () => {
    expect(STAMINA_CONFIG.MAX_STAMINA).toBe(100);
    expect(STAMINA_CONFIG.RECOVERY_RATE_PER_HOUR).toBe(10);
    expect(DETAIL_LEVEL_CONFIG.MIN_DETAIL_LEVEL).toBe(1);
    expect(DETAIL_LEVEL_CONFIG.MAX_DETAIL_LEVEL).toBe(5);
  });
});

describe('simulateCoinReward', () => {
  it('calculates base reward for minimal task', () => {
    expect(simulateCoinReward(1, false, false)).toBe(10);
  });

  it('applies detail multiplier linearly', () => {
    expect(simulateCoinReward(5, false, false)).toBe(20);
  });

  it('applies prerequisite and benefit bonuses', () => {
    expect(simulateCoinReward(5, true, true)).toBe(28);
  });
});

describe('simulateCrystalReward', () => {
  it('calculates base crystal from estimated hours', () => {
    expect(simulateCrystalReward(1, false, false, false)).toBe(5);
    expect(simulateCrystalReward(10, false, false, false)).toBe(50);
  });

  it('applies bonuses including parent task bonus', () => {
    expect(simulateCrystalReward(10, true, true, false)).toBe(72);
    expect(simulateCrystalReward(10, true, true, true)).toBe(216);
  });
});

describe('simulateStaminaRecovery', () => {
  it('recovers stamina based on elapsed time', () => {
    expect(simulateStaminaRecovery(1, 50)).toBe(60);
    expect(simulateStaminaRecovery(5, 0)).toBe(50);
  });

  it('caps stamina at max value', () => {
    expect(simulateStaminaRecovery(10, 0)).toBe(100);
    expect(simulateStaminaRecovery(5, 90)).toBe(100);
  });
});
