/**
 * 報酬計算テストスクリプト
 * 
 * コイン・クリスタル・スタミナの計算ロジックをテスト
 * 
 * 実行方法:
 * npm run test:rewards
 */

import { log, printSummary } from './test-utils';
import {
  calculateDetailLevel,
  calculateCoinReward,
  calculateCrystalReward,
  calculateTaskCreateStaminaCost,
  getTaskEditStaminaCost,
  calculateStaminaRecovery,
  getStaminaPercentage,
  getStaminaStatus,
  calculateEditBonusCoin,
} from '../lib/utils/reward-utils';
import type { Task, TaskChecklistItem } from '../types/database';

async function testRewards() {
  log.section('報酬計算テスト開始');

  const results = { passed: 0, failed: 0 };

  // Test 1: 詳細度計算テスト
  try {
    log.info('Test 1: 詳細度計算テスト');

    // ケース1: 最小限のタスク（詳細度1）
    const task1: Partial<Task> = {
      title: 'テストタスク',
      estimated_hours: 1,
    };
    const level1 = calculateDetailLevel(task1);
    
    if (level1 === 1) {
      log.success('詳細度1: 最小限のタスク ✓');
    } else {
      throw new Error(`期待値: 1, 実際: ${level1}`);
    }

    // ケース2: 内容あり（詳細度2）
    const task2: Partial<Task> = {
      title: 'テストタスク',
      description: 'これは10文字以上の説明文です',
      estimated_hours: 1,
    };
    const level2 = calculateDetailLevel(task2);
    
    if (level2 === 2) {
      log.success('詳細度2: 内容あり ✓');
    } else {
      throw new Error(`期待値: 2, 実際: ${level2}`);
    }

    // ケース3: 内容・メリット・前提条件・長期タスク（詳細度5）
    const task3: Partial<Task> = {
      title: 'テストタスク',
      description: 'これは10文字以上の説明文です',
      benefits: 'これは10文字以上のメリット説明です',
      estimated_hours: 15,
    };
    const checklist3: TaskChecklistItem[] = [
      { id: '1', task_id: 'test', item_text: '項目1', is_checked: false, display_order: 1, created_at: '', updated_at: '' },
      { id: '2', task_id: 'test', item_text: '項目2', is_checked: false, display_order: 2, created_at: '', updated_at: '' },
      { id: '3', task_id: 'test', item_text: '項目3', is_checked: false, display_order: 3, created_at: '', updated_at: '' },
    ];
    const level3 = calculateDetailLevel(task3, checklist3);
    
    if (level3 === 5) {
      log.success('詳細度5: 完全なタスク ✓');
    } else {
      throw new Error(`期待値: 5, 実際: ${level3}`);
    }

    results.passed++;
  } catch (error) {
    log.error(`詳細度計算テスト失敗: ${error}`);
    results.failed++;
  }

  // Test 2: コイン報酬計算テスト
  try {
    log.info('Test 2: コイン報酬計算テスト');

    // ケース1: 基本コイン（詳細度1、ボーナスなし）
    const coin1 = calculateCoinReward(1, false, false);
    if (coin1 === 10) {
      log.success(`基本コイン: ${coin1}コイン ✓`);
    } else {
      throw new Error(`期待値: 10, 実際: ${coin1}`);
    }

    // ケース2: 詳細度5、ボーナスなし
    const coin2 = calculateCoinReward(5, false, false);
    if (coin2 === 20) {
      log.success(`詳細度5: ${coin2}コイン ✓`);
    } else {
      throw new Error(`期待値: 20, 実際: ${coin2}`);
    }

    // ケース3: 詳細度5、前提条件・メリットあり
    const coin3 = calculateCoinReward(5, true, true);
    // 20 * 1.2 * 1.2 = 28.8 → 28コイン
    if (coin3 === 28) {
      log.success(`詳細度5+ボーナス: ${coin3}コイン ✓`);
    } else {
      throw new Error(`期待値: 28, 実際: ${coin3}`);
    }

    results.passed++;
  } catch (error) {
    log.error(`コイン報酬計算テスト失敗: ${error}`);
    results.failed++;
  }

  // Test 3: クリスタル報酬計算テスト
  try {
    log.info('Test 3: クリスタル報酬計算テスト');

    // ケース1: 1時間タスク、ボーナスなし
    const crystal1 = calculateCrystalReward(1, false, false, false);
    if (crystal1 === 5) {
      log.success(`1時間タスク: ${crystal1}クリスタル ✓`);
    } else {
      throw new Error(`期待値: 5, 実際: ${crystal1}`);
    }

    // ケース2: 10時間タスク、前提条件・メリットあり
    const crystal2 = calculateCrystalReward(10, true, true, false);
    // 50 * 1.2 * 1.2 = 72
    if (crystal2 === 72) {
      log.success(`10時間タスク+ボーナス: ${crystal2}クリスタル ✓`);
    } else {
      throw new Error(`期待値: 72, 実際: ${crystal2}`);
    }

    // ケース3: 10時間親タスク、前提条件・メリットあり
    const crystal3 = calculateCrystalReward(10, true, true, true);
    // 50 * 1.2 * 1.2 * 3.0 = 216
    if (crystal3 === 216) {
      log.success(`親タスク完了ボーナス: ${crystal3}クリスタル ✓`);
    } else {
      throw new Error(`期待値: 216, 実際: ${crystal3}`);
    }

    results.passed++;
  } catch (error) {
    log.error(`クリスタル報酬計算テスト失敗: ${error}`);
    results.failed++;
  }

  // Test 4: スタミナ消費計算テスト
  try {
    log.info('Test 4: スタミナ消費計算テスト');

    // ケース1: 基本タスク作成
    const stamina1 = calculateTaskCreateStaminaCost(false, false);
    if (stamina1 === 10) {
      log.success(`基本タスク作成: ${stamina1}スタミナ消費 ✓`);
    } else {
      throw new Error(`期待値: 10, 実際: ${stamina1}`);
    }

    // ケース2: 前提条件・メリットあり
    const stamina2 = calculateTaskCreateStaminaCost(true, true);
    // 10 + 2 + 2 = 14
    if (stamina2 === 14) {
      log.success(`詳細タスク作成: ${stamina2}スタミナ消費 ✓`);
    } else {
      throw new Error(`期待値: 14, 実際: ${stamina2}`);
    }

    // ケース3: タスク編集
    const stamina3 = getTaskEditStaminaCost();
    if (stamina3 === 5) {
      log.success(`タスク編集: ${stamina3}スタミナ消費 ✓`);
    } else {
      throw new Error(`期待値: 5, 実際: ${stamina3}`);
    }

    results.passed++;
  } catch (error) {
    log.error(`スタミナ消費計算テスト失敗: ${error}`);
    results.failed++;
  }

  // Test 5: スタミナ回復計算テスト
  try {
    log.info('Test 5: スタミナ回復計算テスト');

    // ケース1: 1時間経過
    const recovered1 = calculateStaminaRecovery(1, 50);
    if (recovered1 === 60) {
      log.success(`1時間回復: 50 → ${recovered1}スタミナ ✓`);
    } else {
      throw new Error(`期待値: 60, 実際: ${recovered1}`);
    }

    // ケース2: 10時間経過（満タン）
    const recovered2 = calculateStaminaRecovery(10, 0);
    if (recovered2 === 100) {
      log.success(`10時間回復（満タン）: 0 → ${recovered2}スタミナ ✓`);
    } else {
      throw new Error(`期待値: 100, 実際: ${recovered2}`);
    }

    // ケース3: 最大値を超えない
    const recovered3 = calculateStaminaRecovery(20, 90);
    if (recovered3 === 100) {
      log.success(`最大値制限: 90 → ${recovered3}スタミナ ✓`);
    } else {
      throw new Error(`期待値: 100, 実際: ${recovered3}`);
    }

    results.passed++;
  } catch (error) {
    log.error(`スタミナ回復計算テスト失敗: ${error}`);
    results.failed++;
  }

  // Test 6: スタミナステータス判定テスト
  try {
    log.info('Test 6: スタミナステータス判定テスト');

    const status1 = getStaminaStatus(20);
    const status2 = getStaminaStatus(50);
    const status3 = getStaminaStatus(80);

    if (status1 === 'low' && status2 === 'medium' && status3 === 'high') {
      log.success(`スタミナステータス判定: low/medium/high ✓`);
      results.passed++;
    } else {
      throw new Error(`判定エラー: ${status1}/${status2}/${status3}`);
    }
  } catch (error) {
    log.error(`スタミナステータス判定テスト失敗: ${error}`);
    results.failed++;
  }

  // Test 7: 編集ボーナスコイン計算テスト
  try {
    log.info('Test 7: 編集ボーナスコイン計算テスト');

    // 詳細度が2→5に向上
    const bonus = calculateEditBonusCoin(2, 5);
    // (5-2) * 5 = 15
    if (bonus === 15) {
      log.success(`編集ボーナス（2→5）: ${bonus}コイン ✓`);
      results.passed++;
    } else {
      throw new Error(`期待値: 15, 実際: ${bonus}`);
    }
  } catch (error) {
    log.error(`編集ボーナスコイン計算テスト失敗: ${error}`);
    results.failed++;
  }

  // 実例シミュレーション
  log.section('実例シミュレーション');
  
  try {
    log.info('シナリオ: 長期プロジェクトタスクの作成〜完了');
    
    const projectTask: Partial<Task> = {
      title: '新機能開発',
      description: '詳細な設計書を作成し、実装とテストを行う。コードレビューも必須。',
      benefits: 'チーム全体のスキル向上、プロダクトの価値向上、顧客満足度アップ',
      estimated_hours: 20,
    };
    
    const projectChecklist: TaskChecklistItem[] = [
      { id: '1', task_id: 'p1', item_text: '要件定義完了', is_checked: false, display_order: 1, created_at: '', updated_at: '' },
      { id: '2', task_id: 'p1', item_text: '設計書作成', is_checked: false, display_order: 2, created_at: '', updated_at: '' },
      { id: '3', task_id: 'p1', item_text: 'コードレビュー承認', is_checked: false, display_order: 3, created_at: '', updated_at: '' },
    ];
    
    const detailLevel = calculateDetailLevel(projectTask, projectChecklist);
    const coinReward = calculateCoinReward(detailLevel, true, true);
    const crystalReward = calculateCrystalReward(20, true, true, false);
    const staminaCost = calculateTaskCreateStaminaCost(true, true);
    
    log.info(`詳細度: ${detailLevel}/5`);
    log.info(`獲得コイン: ${coinReward}コイン`);
    log.info(`完了時クリスタル: ${crystalReward}クリスタル`);
    log.info(`スタミナ消費: ${staminaCost}pt`);
    
    log.success('シミュレーション完了');
    results.passed++;
  } catch (error) {
    log.error(`シミュレーション失敗: ${error}`);
    results.failed++;
  }

  // 結果サマリー表示
  printSummary('報酬計算テスト', results);
}

// テスト実行
testRewards().catch((error) => {
  log.error(`予期しないエラー: ${error}`);
  process.exit(1);
});
