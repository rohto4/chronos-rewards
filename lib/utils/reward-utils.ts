/**
 * 報酬計算ユーティリティ関数
 * 
 * コイン・クリスタルの報酬計算、スタミナ消費計算を行う
 * game-balance.tsの設定値を使用
 */

import {
  COIN_CONFIG,
  CRYSTAL_CONFIG,
  STAMINA_CONFIG,
  DETAIL_LEVEL_CONFIG,
} from '@/lib/config/game-balance';
import type { Task, TaskChecklistItem } from '@/types/database';

/**
 * タスクの詳細度を計算（1-5）
 * 
 * 計算基準:
 * - 基本: 1
 * - 内容（description）10文字以上: +1
 * - メリット（benefits）10文字以上: +1
 * - 前提条件（checklist）3個以上: +1
 * - 重さ（estimated_hours）10h以上: +1
 * 
 * @param task タスク情報
 * @param checklist チェックリスト（オプション）
 * @returns 詳細度（1-5）
 */
export function calculateDetailLevel(
  task: Partial<Task>,
  checklist?: TaskChecklistItem[]
): number {
  let level = DETAIL_LEVEL_CONFIG.MIN_DETAIL_LEVEL;

  // 内容があれば +1
  if (
    task.description &&
    task.description.length >= DETAIL_LEVEL_CONFIG.MIN_DESCRIPTION_LENGTH
  ) {
    level++;
  }

  // メリットがあれば +1
  if (
    task.benefits &&
    task.benefits.length >= DETAIL_LEVEL_CONFIG.MIN_BENEFIT_LENGTH
  ) {
    level++;
  }

  // 前提条件が3個以上あれば +1
  if (checklist && checklist.length >= DETAIL_LEVEL_CONFIG.MIN_CHECKLIST_COUNT) {
    level++;
  }

  // 重さが10h以上なら +1
  if (
    task.estimated_hours &&
    task.estimated_hours >= DETAIL_LEVEL_CONFIG.MIN_LONG_TERM_HOURS
  ) {
    level++;
  }

  // 最大値を超えないようにする
  return Math.min(level, DETAIL_LEVEL_CONFIG.MAX_DETAIL_LEVEL);
}

/**
 * タスク作成時のコイン報酬を計算
 * 
 * 計算式:
 * 基本コイン × 詳細度倍率 × 前提条件ボーナス × メリットボーナス
 * 
 * @param detailLevel 詳細度（1-5）
 * @param hasPrerequisite 前提条件あり
 * @param hasBenefit メリットあり
 * @returns 獲得コイン数
 */
export function calculateCoinReward(
  detailLevel: number,
  hasPrerequisite: boolean,
  hasBenefit: boolean
): number {
  let multiplier = 1.0;

  // 詳細度による倍率（1-5 → 1.0-2.0倍）
  multiplier += (detailLevel - 1) * COIN_CONFIG.DETAIL_MULTIPLIER_STEP;

  // 前提条件ボーナス
  if (hasPrerequisite) {
    multiplier *= COIN_CONFIG.PREREQUISITE_BONUS;
  }

  // メリットボーナス
  if (hasBenefit) {
    multiplier *= COIN_CONFIG.BENEFIT_BONUS;
  }

  return Math.floor(COIN_CONFIG.BASE_COIN * multiplier);
}

/**
 * タスク完了時のクリスタル報酬を計算
 * 
 * 計算式:
 * 基本クリスタル × 前提条件ボーナス × メリットボーナス × 親タスクボーナス
 * 
 * @param estimatedHours タスクの重さ（時間）
 * @param hasPrerequisite 前提条件あり
 * @param hasBenefit メリットあり
 * @param isParentTask 親タスクか
 * @returns 獲得クリスタル数
 */
export function calculateCrystalReward(
  estimatedHours: number,
  hasPrerequisite: boolean,
  hasBenefit: boolean,
  isParentTask: boolean
): number {
  // 基本クリスタル = 時間 × 係数
  let baseCrystal = Math.floor(
    estimatedHours * CRYSTAL_CONFIG.BASE_CRYSTAL_PER_HOUR
  );
  let multiplier = 1.0;

  // 前提条件ボーナス
  if (hasPrerequisite) {
    multiplier *= CRYSTAL_CONFIG.PREREQUISITE_BONUS;
  }

  // メリットボーナス
  if (hasBenefit) {
    multiplier *= CRYSTAL_CONFIG.BENEFIT_BONUS;
  }

  // 親タスクボーナス（大きい）
  if (isParentTask) {
    multiplier *= CRYSTAL_CONFIG.PARENT_TASK_BONUS;
  }

  return Math.floor(baseCrystal * multiplier);
}

/**
 * タスク作成時のスタミナ消費量を計算
 * 
 * 計算式:
 * 基本コスト + 前提条件コスト + メリットコスト
 * 
 * @param hasPrerequisite 前提条件あり
 * @param hasBenefit メリットあり
 * @returns 消費スタミナ
 */
export function calculateTaskCreateStaminaCost(
  hasPrerequisite: boolean,
  hasBenefit: boolean
): number {
  let cost = STAMINA_CONFIG.TASK_CREATE_COST;

  if (hasPrerequisite) {
    cost += STAMINA_CONFIG.PREREQUISITE_COST;
  }

  if (hasBenefit) {
    cost += STAMINA_CONFIG.BENEFIT_COST;
  }

  return cost;
}

/**
 * タスク編集時のスタミナ消費量を取得
 * 
 * @returns 消費スタミナ
 */
export function getTaskEditStaminaCost(): number {
  return STAMINA_CONFIG.TASK_EDIT_COST;
}

/**
 * スタミナ回復量を計算
 * 
 * @param hoursPassed 経過時間（時間）
 * @param currentStamina 現在のスタミナ
 * @returns 回復後のスタミナ
 */
export function calculateStaminaRecovery(
  hoursPassed: number,
  currentStamina: number
): number {
  const recoveryAmount = Math.floor(
    hoursPassed * STAMINA_CONFIG.RECOVERY_RATE_PER_HOUR
  );
  return Math.min(
    currentStamina + recoveryAmount,
    STAMINA_CONFIG.MAX_STAMINA
  );
}

/**
 * スタミナが不足しているかチェック
 * 
 * @param currentStamina 現在のスタミナ
 * @param requiredStamina 必要なスタミナ
 * @returns 不足していればtrue
 */
export function isStaminaInsufficient(
  currentStamina: number,
  requiredStamina: number
): boolean {
  return currentStamina < requiredStamina;
}

/**
 * スタミナ残量の割合を計算（0-100）
 * 
 * @param currentStamina 現在のスタミナ
 * @param maxStamina 最大スタミナ
 * @returns 割合（0-100）
 */
export function getStaminaPercentage(
  currentStamina: number,
  maxStamina: number = STAMINA_CONFIG.MAX_STAMINA
): number {
  return Math.floor((currentStamina / maxStamina) * 100);
}

/**
 * スタミナ残量に応じた状態を取得
 * 
 * @param currentStamina 現在のスタミナ
 * @returns 状態（'low' | 'medium' | 'high'）
 */
export function getStaminaStatus(
  currentStamina: number
): 'low' | 'medium' | 'high' {
  const percentage = getStaminaPercentage(currentStamina);

  if (percentage <= 25) {
    return 'low';
  } else if (percentage <= 60) {
    return 'medium';
  } else {
    return 'high';
  }
}

/**
 * 詳細度向上によるボーナスコインを計算
 * タスク編集時に使用
 * 
 * @param oldLevel 旧詳細度
 * @param newLevel 新詳細度
 * @returns ボーナスコイン
 */
export function calculateEditBonusCoin(
  oldLevel: number,
  newLevel: number
): number {
  const levelDiff = newLevel - oldLevel;
  if (levelDiff <= 0) {
    return 0;
  }

  return levelDiff * COIN_CONFIG.EDIT_BONUS_PER_LEVEL;
}

/**
 * タスク情報から前提条件・メリットの有無を判定
 * 
 * @param task タスク情報
 * @param checklist チェックリスト（オプション）
 * @returns {hasPrerequisite, hasBenefit}
 */
export function getTaskBonusFlags(
  task: Partial<Task>,
  checklist?: TaskChecklistItem[]
): { hasPrerequisite: boolean; hasBenefit: boolean } {
  return {
    hasPrerequisite: (checklist && checklist.length > 0) || false,
    hasBenefit: (task.benefits && task.benefits.length > 0) || false,
  };
}
