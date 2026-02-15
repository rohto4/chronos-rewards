/**
 * Chronos Rewards - ゲームバランス設定
 * 
 * このファイルで報酬計算やスタミナ回復の数値を調整できます。
 * 変更後、アプリを再起動すると反映されます。
 */

// ==========================================
// コイン報酬設定
// ==========================================

export const COIN_CONFIG = {
  /**
   * タスク作成時の基本コイン
   */
  BASE_COIN: 10,

  /**
   * 詳細度による倍率
   * 詳細度1〜5に対して、1.0〜2.0倍の範囲で線形増加
   * 
   * 計算式: 1.0 + (detail_level - 1) * DETAIL_MULTIPLIER_STEP
   * 例: 
   *   詳細度1 → 1.0倍
   *   詳細度3 → 1.5倍
   *   詳細度5 → 2.0倍
   */
  DETAIL_MULTIPLIER_STEP: 0.25,

  /**
   * 前提条件ありのボーナス倍率
   */
  PREREQUISITE_BONUS: 1.2,

  /**
   * メリット記入ありのボーナス倍率
   */
  BENEFIT_BONUS: 1.2,

  /**
   * タスク編集時の詳細度向上ボーナス
   * (新詳細度 - 旧詳細度) × この値 = 追加コイン
   */
  EDIT_BONUS_PER_LEVEL: 5,
} as const;

// ==========================================
// クリスタル報酬設定
// ==========================================

export const CRYSTAL_CONFIG = {
  /**
   * 基本クリスタル計算の係数
   * 基本クリスタル = estimated_hours × この値
   * 
   * 例: 
   *   1h → 5個
   *   10h → 50個
   */
  BASE_CRYSTAL_PER_HOUR: 5,

  /**
   * 前提条件ありのボーナス倍率
   */
  PREREQUISITE_BONUS: 1.2,

  /**
   * メリット記入ありのボーナス倍率
   */
  BENEFIT_BONUS: 1.2,

  /**
   * 親タスク完了時の特別ボーナス倍率
   * 子タスクがあるタスクを完了した場合、この倍率がかかる
   */
  PARENT_TASK_BONUS: 3.0,
} as const;

// ==========================================
// スタミナ設定
// ==========================================

export const STAMINA_CONFIG = {
  /**
   * 最大スタミナ
   */
  MAX_STAMINA: 100,

  /**
   * 初期スタミナ（新規ユーザー登録時）
   */
  INITIAL_STAMINA: 100,

  /**
   * スタミナ回復速度（ポイント/時間）
   * 
   * 現在の設定: 10ポイント/時間
   * → 全回復まで10時間
   * 
   * 変更例:
   *   20 → 5時間で全回復（速い）
   *   5 → 20時間で全回復（遅い）
   */
  RECOVERY_RATE_PER_HOUR: 10,

  /**
   * タスク作成時の基本スタミナ消費
   */
  TASK_CREATE_COST: 10,

  /**
   * タスク編集時のスタミナ消費
   */
  TASK_EDIT_COST: 5,

  /**
   * 前提条件追加時の追加スタミナ消費
   */
  PREREQUISITE_COST: 2,

  /**
   * メリット記入時の追加スタミナ消費
   */
  BENEFIT_COST: 2,

  /**
   * 簡易日報作成時のスタミナ消費（将来機能）
   */
  DAILY_REPORT_COST: 3,
} as const;

// ==========================================
// 詳細度計算設定
// ==========================================

export const DETAIL_LEVEL_CONFIG = {
  /**
   * 内容（description）が評価される最小文字数
   */
  MIN_DESCRIPTION_LENGTH: 10,

  /**
   * メリット（benefits）が評価される最小文字数
   */
  MIN_BENEFIT_LENGTH: 10,

  /**
   * 前提条件（checklist）が評価される最小個数
   */
  MIN_CHECKLIST_COUNT: 3,

  /**
   * 長期タスクと判定される最小時間（hours）
   */
  MIN_LONG_TERM_HOURS: 10,

  /**
   * 詳細度の最小値
   */
  MIN_DETAIL_LEVEL: 1,

  /**
   * 詳細度の最大値
   */
  MAX_DETAIL_LEVEL: 5,
} as const;

// ==========================================
// 計算ヘルパー関数（参考用）
// ==========================================

/**
 * コイン報酬計算のシミュレーション
 * 
 * @param detailLevel 詳細度（1-5）
 * @param hasPrerequisite 前提条件あり
 * @param hasBenefit メリットあり
 * @returns 獲得コイン数
 */
export function simulateCoinReward(
  detailLevel: number,
  hasPrerequisite: boolean,
  hasBenefit: boolean
): number {
  let multiplier = 1.0;

  // 詳細度による倍率
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
 * クリスタル報酬計算のシミュレーション
 * 
 * @param estimatedHours タスクの重さ（時間）
 * @param hasPrerequisite 前提条件あり
 * @param hasBenefit メリットあり
 * @param isParentTask 親タスクか
 * @returns 獲得クリスタル数
 */
export function simulateCrystalReward(
  estimatedHours: number,
  hasPrerequisite: boolean,
  hasBenefit: boolean,
  isParentTask: boolean
): number {
  let baseCrystal = Math.floor(estimatedHours * CRYSTAL_CONFIG.BASE_CRYSTAL_PER_HOUR);
  let multiplier = 1.0;

  // 前提条件ボーナス
  if (hasPrerequisite) {
    multiplier *= CRYSTAL_CONFIG.PREREQUISITE_BONUS;
  }

  // メリットボーナス
  if (hasBenefit) {
    multiplier *= CRYSTAL_CONFIG.BENEFIT_BONUS;
  }

  // 親タスクボーナス
  if (isParentTask) {
    multiplier *= CRYSTAL_CONFIG.PARENT_TASK_BONUS;
  }

  return Math.floor(baseCrystal * multiplier);
}

/**
 * スタミナ回復量計算のシミュレーション
 * 
 * @param hoursPassed 経過時間（時間）
 * @param currentStamina 現在のスタミナ
 * @returns 回復後のスタミナ
 */
export function simulateStaminaRecovery(
  hoursPassed: number,
  currentStamina: number
): number {
  const recoveryAmount = Math.floor(hoursPassed * STAMINA_CONFIG.RECOVERY_RATE_PER_HOUR);
  return Math.min(currentStamina + recoveryAmount, STAMINA_CONFIG.MAX_STAMINA);
}

// ==========================================
// 使用例・テストケース
// ==========================================

if (require.main === module) {
  console.log('=== Chronos Rewards - ゲームバランス設定テスト ===\n');

  console.log('【例1: 簡単な短期タスク】');
  console.log('- タスク名: 買い物に行く');
  console.log('- 重さ: 1h');
  console.log('- 詳細なし、メリットなし、前提条件なし');
  console.log(`→ 獲得コイン: ${simulateCoinReward(1, false, false)}コイン`);
  console.log(`→ 完了時クリスタル: ${simulateCrystalReward(1, false, false, false)}個\n`);

  console.log('【例2: 詳細な長期タスク】');
  console.log('- タスク名: プロジェクト企画書作成');
  console.log('- 重さ: 10h');
  console.log('- 内容: 詳細説明あり（100文字）');
  console.log('- メリット: 記入あり（50文字）');
  console.log('- 前提条件: 5個');
  console.log(`→ 詳細度: 4 (内容+メリット+前提条件+長期)`);
  console.log(`→ 獲得コイン: ${simulateCoinReward(4, true, true)}コイン`);
  console.log(`→ 完了時クリスタル: ${simulateCrystalReward(10, true, true, false)}個\n`);

  console.log('【例3: 親タスク完了ボーナス】');
  console.log('- 上記の長期タスクが親タスクだった場合');
  console.log(`→ 完了時クリスタル: ${simulateCrystalReward(10, true, true, true)}個（3倍ボーナス）\n`);

  console.log('【スタミナ回復シミュレーション】');
  console.log(`- 現在スタミナ: 0`);
  console.log(`- 1時間後: ${simulateStaminaRecovery(1, 0)}pt`);
  console.log(`- 5時間後: ${simulateStaminaRecovery(5, 0)}pt`);
  console.log(`- 10時間後: ${simulateStaminaRecovery(10, 0)}pt（全回復）\n`);

  console.log('【スタミナ消費例】');
  console.log(`- タスク作成（基本）: ${STAMINA_CONFIG.TASK_CREATE_COST}pt`);
  console.log(`- + 前提条件あり: +${STAMINA_CONFIG.PREREQUISITE_COST}pt`);
  console.log(`- + メリットあり: +${STAMINA_CONFIG.BENEFIT_COST}pt`);
  console.log(`→ 合計: ${STAMINA_CONFIG.TASK_CREATE_COST + STAMINA_CONFIG.PREREQUISITE_COST + STAMINA_CONFIG.BENEFIT_COST}pt\n`);
}
