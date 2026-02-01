/**
 * テストスクリプト用Supabaseクライアント
 * 
 * Node.js環境からSupabaseに接続するためのヘルパー関数
 * 環境変数から認証情報を読み込む
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.localを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * 環境変数の検証
 */
function validateEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ 環境変数が設定されていません');
    console.error('');
    console.error('.env.localファイルに以下を設定してください:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    console.error('');
    process.exit(1);
  }

  return { url, anonKey };
}

/**
 * テスト用Supabaseクライアントを作成
 */
export function createTestClient() {
  const { url, anonKey } = validateEnv();
  return createClient<Database>(url, anonKey);
}

/**
 * カラーログ出力ヘルパー
 */
export const log = {
  success: (message: string) => console.log(`✅ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  info: (message: string) => console.log(`ℹ️  ${message}`),
  warning: (message: string) => console.warn(`⚠️  ${message}`),
  section: (message: string) => {
    console.log('');
    console.log(`${'='.repeat(50)}`);
    console.log(`  ${message}`);
    console.log(`${'='.repeat(50)}`);
  },
};

/**
 * テスト結果のサマリー表示
 */
export function printSummary(
  testName: string,
  results: { passed: number; failed: number }
) {
  console.log('');
  console.log(`${'='.repeat(50)}`);
  console.log(`  ${testName} - テスト結果`);
  console.log(`${'='.repeat(50)}`);
  console.log(`✅ 成功: ${results.passed}`);
  console.log(`❌ 失敗: ${results.failed}`);
  console.log(`${'='.repeat(50)}`);
  console.log('');

  if (results.failed > 0) {
    process.exit(1);
  }
}
