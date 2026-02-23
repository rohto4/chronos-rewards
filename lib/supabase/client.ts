/**
 * Supabaseクライアント設定
 * 
 * クライアントサイドで使用するSupabaseクライアントを作成
 * ブラウザ環境でのみ使用可能
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

/**
 * Supabaseクライアントのシングルトンインスタンスを作成
 * 
 * @returns Supabaseクライアント（型安全）
 * 
 * 使用例:
 * ```typescript
 * import { supabase } from '@/lib/supabase/client';
 * const { data, error } = await supabase.from('tasks').select('*');
 * ```
 */
const getBrowserConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const createClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getBrowserConfig();
  return createClientComponentClient<Database>({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
};

// デフォルトエクスポート
export const supabase = createClient();
