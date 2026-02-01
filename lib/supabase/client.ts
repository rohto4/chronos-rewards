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
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// デフォルトエクスポート
export const supabase = createClient();
