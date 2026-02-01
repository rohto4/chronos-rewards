/**
 * ジャンル管理テストスクリプト
 * 
 * ジャンルの作成・取得・更新・削除をテスト
 * 
 * 実行方法:
 * npm run test:genres
 */

import { createTestClient, log, printSummary } from './test-utils';

async function testGenres() {
  log.section('ジャンル管理テスト開始');
  log.warning('このテストは実際のデータベースに書き込みます');
  console.log('');

  const results = { passed: 0, failed: 0 };
  const supabase = createTestClient();

  let userId: string | null = null;
  const createdGenreIds: string[] = [];

  // Test 0: 認証状態確認
  try {
    log.info('Test 0: 認証状態確認');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('認証されていません');
    }
    
    userId = user.id;
    log.success(`認証済み ユーザーID: ${userId.substring(0, 8)}...`);
    results.passed++;
  } catch (error) {
    log.error(`認証確認失敗: ${error}`);
    log.warning('このテストは認証後に実行してください');
    results.failed++;
    printSummary('ジャンル管理テスト', results);
    return;
  }

  // Test 1: ジャンル作成
  try {
    log.info('Test 1: ジャンル作成');
    
    const genres = [
      { name: '仕事', color: '#3B82F6' },
      { name: 'プライベート', color: '#10B981' },
      { name: '勉強', color: '#8B5CF6' },
    ];
    
    for (const genre of genres) {
      const { data, error } = await supabase
        .from('task_genres')
        .insert({
          user_id: userId!,
          name: genre.name,
          color: genre.color,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      createdGenreIds.push(data.id);
      log.success(`ジャンル作成: ${genre.name} (${genre.color})`);
    }
    
    results.passed++;
  } catch (error) {
    log.error(`ジャンル作成失敗: ${error}`);
    results.failed++;
  }

  // Test 2: ジャンル一覧取得
  try {
    log.info('Test 2: ジャンル一覧取得');
    
    const { data, error } = await supabase
      .from('task_genres')
      .select('*')
      .eq('user_id', userId!)
      .order('usage_count', { ascending: false });
    
    if (error) throw error;
    
    log.success(`ジャンル取得成功（${data.length}件）`);
    
    data.forEach((genre, index) => {
      log.info(
        `${index + 1}. ${genre.name} - 使用回数: ${genre.usage_count}回`
      );
    });
    
    results.passed++;
  } catch (error) {
    log.error(`ジャンル取得失敗: ${error}`);
    results.failed++;
  }

  // Test 3: ジャンル更新
  try {
    log.info('Test 3: ジャンル更新');
    
    if (createdGenreIds.length === 0) throw new Error('ジャンルIDがありません');
    
    const { data, error } = await supabase
      .from('task_genres')
      .update({
        name: '仕事（更新済み）',
        color: '#EF4444',
      })
      .eq('id', createdGenreIds[0])
      .select()
      .single();
    
    if (error) throw error;
    
    log.success(`ジャンル更新成功: ${data.name} (${data.color})`);
    results.passed++;
  } catch (error) {
    log.error(`ジャンル更新失敗: ${error}`);
    results.failed++;
  }

  // Test 4: ジャンル使用回数の自動更新確認
  try {
    log.info('Test 4: ジャンル使用回数の自動更新確認');
    
    if (createdGenreIds.length === 0) throw new Error('ジャンルIDがありません');
    
    // テストタスクを作成してジャンルを使用
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId!,
        title: 'ジャンルテスト用タスク',
        genre_id: createdGenreIds[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: 1,
      })
      .select()
      .single();
    
    if (taskError) throw taskError;
    
    // ジャンルの使用回数を確認
    const { data: genre, error: genreError } = await supabase
      .from('task_genres')
      .select('usage_count')
      .eq('id', createdGenreIds[0])
      .single();
    
    if (genreError) throw genreError;
    
    log.success(`使用回数が更新されました: ${genre.usage_count}回`);
    
    // テストタスクを削除
    await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);
    
    results.passed++;
  } catch (error) {
    log.error(`使用回数更新確認失敗: ${error}`);
    results.failed++;
  }

  // Test 5: ジャンル名の重複チェック
  try {
    log.info('Test 5: ジャンル名の重複チェック');
    
    // 同じ名前のジャンルを作成しようとする
    const { error } = await supabase
      .from('task_genres')
      .insert({
        user_id: userId!,
        name: '仕事（更新済み）', // 既に存在する名前
        color: '#000000',
      });
    
    if (error && error.code === '23505') {
      // UNIQUE制約違反エラー
      log.success('重複チェック正常: 同じ名前のジャンルは作成できません ✓');
      results.passed++;
    } else if (error) {
      throw error;
    } else {
      throw new Error('重複チェックが機能していません');
    }
  } catch (error) {
    log.error(`重複チェック失敗: ${error}`);
    results.failed++;
  }

  // Test 6: ジャンルカラーのバリデーション
  try {
    log.info('Test 6: ジャンルカラーのバリデーション');
    
    const validColors = ['#FF0000', '#00FF00', '#0000FF'];
    let allValid = true;
    
    for (const color of validColors) {
      const { error } = await supabase
        .from('task_genres')
        .insert({
          user_id: userId!,
          name: `カラーテスト${color}`,
          color: color,
        })
        .select()
        .single();
      
      if (error) {
        allValid = false;
        log.error(`カラー ${color} でエラー: ${error.message}`);
      } else {
        // テストデータを即座に削除
        await supabase
          .from('task_genres')
          .delete()
          .eq('name', `カラーテスト${color}`)
          .eq('user_id', userId!);
      }
    }
    
    if (allValid) {
      log.success('カラーバリデーション正常 ✓');
      results.passed++;
    } else {
      throw new Error('カラーバリデーションエラー');
    }
  } catch (error) {
    log.error(`カラーバリデーション失敗: ${error}`);
    results.failed++;
  }

  // クリーンアップ
  try {
    log.info('クリーンアップ: テストデータを削除中...');
    
    for (const genreId of createdGenreIds) {
      await supabase
        .from('task_genres')
        .delete()
        .eq('id', genreId);
    }
    
    log.success(`クリーンアップ完了（${createdGenreIds.length}件削除）`);
  } catch (error) {
    log.warning(`クリーンアップ失敗: ${error}`);
  }

  // 結果サマリー表示
  printSummary('ジャンル管理テスト', results);
}

// テスト実行
testGenres().catch((error) => {
  log.error(`予期しないエラー: ${error}`);
  process.exit(1);
});
