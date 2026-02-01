/**
 * タスクCRUDテストスクリプト
 * 
 * タスクの作成・取得・更新・削除をテスト
 * ※実際のデータベース操作を行うため、テスト用ユーザーで実行推奨
 * 
 * 実行方法:
 * npm run test:tasks
 */

import { createTestClient, log, printSummary } from './test-utils';
import { addDays } from 'date-fns';

async function testTasks() {
  log.section('タスクCRUDテスト開始');
  log.warning('このテストは実際のデータベースに書き込みます');
  log.warning('テスト用アカウントで実行してください');
  console.log('');

  const results = { passed: 0, failed: 0 };
  const supabase = createTestClient();

  // テスト用のユーザーIDを取得（実際の認証が必要）
  let userId: string | null = null;
  let createdTaskId: string | null = null;
  let createdGenreId: string | null = null;

  // Test 0: 認証状態確認
  try {
    log.info('Test 0: 認証状態確認');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('認証されていません。先にログインが必要です。');
    }
    
    userId = user.id;
    log.success(`認証済み ユーザーID: ${userId.substring(0, 8)}...`);
    results.passed++;
  } catch (error) {
    log.error(`認証確認失敗: ${error}`);
    log.warning('このテストは認証後に実行してください');
    results.failed++;
    printSummary('タスクCRUDテスト', results);
    return;
  }

  // Test 1: ジャンル作成
  try {
    log.info('Test 1: ジャンル作成');
    
    const { data, error } = await supabase
      .from('task_genres')
      .insert({
        user_id: userId!,
        name: 'テストジャンル',
        color: '#3B82F6',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    createdGenreId = data.id;
    log.success(`ジャンル作成成功 ID: ${createdGenreId.substring(0, 8)}...`);
    results.passed++;
  } catch (error) {
    log.error(`ジャンル作成失敗: ${error}`);
    results.failed++;
  }

  // Test 2: タスク作成
  try {
    log.info('Test 2: タスク作成');
    
    const deadline = addDays(new Date(), 7).toISOString();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId!,
        title: 'テストタスク',
        description: 'これはテスト用のタスクです。実際のデータベースに保存されます。',
        genre_id: createdGenreId,
        deadline: deadline,
        estimated_hours: 5,
        benefits: 'テストの成功により、システムの信頼性が向上します。',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    createdTaskId = data.id;
    log.success(`タスク作成成功 ID: ${createdTaskId.substring(0, 8)}...`);
    log.info(`詳細度: ${data.detail_level}/5`);
    results.passed++;
  } catch (error) {
    log.error(`タスク作成失敗: ${error}`);
    results.failed++;
  }

  // Test 3: チェックリスト追加
  try {
    log.info('Test 3: チェックリスト追加');
    
    if (!createdTaskId) throw new Error('タスクIDがありません');
    
    const checklistItems = [
      { task_id: createdTaskId, item_text: '前提条件1', display_order: 1 },
      { task_id: createdTaskId, item_text: '前提条件2', display_order: 2 },
      { task_id: createdTaskId, item_text: '前提条件3', display_order: 3 },
    ];
    
    const { data, error } = await supabase
      .from('task_checklist')
      .insert(checklistItems)
      .select();
    
    if (error) throw error;
    
    log.success(`チェックリスト追加成功（${data.length}件）`);
    results.passed++;
  } catch (error) {
    log.error(`チェックリスト追加失敗: ${error}`);
    results.failed++;
  }

  // Test 4: タスク取得
  try {
    log.info('Test 4: タスク取得（ジャンル・チェックリスト込み）');
    
    if (!createdTaskId) throw new Error('タスクIDがありません');
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        genre:task_genres(*),
        checklist:task_checklist(*)
      `)
      .eq('id', createdTaskId)
      .single();
    
    if (error) throw error;
    
    log.success(`タスク取得成功`);
    log.info(`タイトル: ${data.title}`);
    log.info(`ジャンル: ${data.genre?.name || 'なし'}`);
    log.info(`チェックリスト: ${data.checklist?.length || 0}件`);
    log.info(`詳細度: ${data.detail_level}/5`);
    results.passed++;
  } catch (error) {
    log.error(`タスク取得失敗: ${error}`);
    results.failed++;
  }

  // Test 5: タスク更新
  try {
    log.info('Test 5: タスク更新');
    
    if (!createdTaskId) throw new Error('タスクIDがありません');
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: 'テストタスク（更新済み）',
        estimated_hours: 10,
      })
      .eq('id', createdTaskId)
      .select()
      .single();
    
    if (error) throw error;
    
    log.success(`タスク更新成功`);
    log.info(`新しいタイトル: ${data.title}`);
    log.info(`新しい重さ: ${data.estimated_hours}時間`);
    results.passed++;
  } catch (error) {
    log.error(`タスク更新失敗: ${error}`);
    results.failed++;
  }

  // Test 6: タスク完了
  try {
    log.info('Test 6: タスク完了');
    
    if (!createdTaskId) throw new Error('タスクIDがありません');
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', createdTaskId)
      .select()
      .single();
    
    if (error) throw error;
    
    log.success(`タスク完了成功`);
    log.info(`完了日時: ${new Date(data.completed_at!).toLocaleString('ja-JP')}`);
    results.passed++;
  } catch (error) {
    log.error(`タスク完了失敗: ${error}`);
    results.failed++;
  }

  // Test 7: 報酬履歴確認
  try {
    log.info('Test 7: 報酬履歴確認');
    
    if (!userId) throw new Error('ユーザーIDがありません');
    
    const { data, error } = await supabase
      .from('reward_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    log.success(`報酬履歴取得成功（${data.length}件）`);
    
    data.forEach((reward, index) => {
      log.info(
        `${index + 1}. ${reward.reward_type === 'coin' ? 'コイン' : 'クリスタル'}: ` +
        `${reward.amount}個 - ${reward.reason}`
      );
    });
    
    results.passed++;
  } catch (error) {
    log.error(`報酬履歴確認失敗: ${error}`);
    results.failed++;
  }

  // Test 8: タスク削除（論理削除）
  try {
    log.info('Test 8: タスク削除（論理削除）');
    
    if (!createdTaskId) throw new Error('タスクIDがありません');
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', createdTaskId)
      .select()
      .single();
    
    if (error) throw error;
    
    log.success(`タスク削除成功（論理削除）`);
    log.info(`削除日時: ${new Date(data.deleted_at!).toLocaleString('ja-JP')}`);
    results.passed++;
  } catch (error) {
    log.error(`タスク削除失敗: ${error}`);
    results.failed++;
  }

  // Test 9: 削除確認（削除されたタスクは取得されない）
  try {
    log.info('Test 9: 削除確認');
    
    if (!userId) throw new Error('ユーザーIDがありません');
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    
    if (error) throw error;
    
    const hasDeletedTask = data.some(task => task.id === createdTaskId);
    
    if (!hasDeletedTask) {
      log.success('削除されたタスクは取得されませんでした ✓');
      results.passed++;
    } else {
      throw new Error('削除されたタスクが取得されました');
    }
  } catch (error) {
    log.error(`削除確認失敗: ${error}`);
    results.failed++;
  }

  // クリーンアップ: テストデータを物理削除
  try {
    log.info('クリーンアップ: テストデータを物理削除中...');
    
    if (createdTaskId) {
      // チェックリスト削除
      await supabase
        .from('task_checklist')
        .delete()
        .eq('task_id', createdTaskId);
      
      // タスク削除
      await supabase
        .from('tasks')
        .delete()
        .eq('id', createdTaskId);
    }
    
    if (createdGenreId) {
      // ジャンル削除
      await supabase
        .from('task_genres')
        .delete()
        .eq('id', createdGenreId);
    }
    
    log.success('クリーンアップ完了');
  } catch (error) {
    log.warning(`クリーンアップ失敗: ${error}`);
  }

  // 結果サマリー表示
  printSummary('タスクCRUDテスト', results);
}

// テスト実行
testTasks().catch((error) => {
  log.error(`予期しないエラー: ${error}`);
  process.exit(1);
});
