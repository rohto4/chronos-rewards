/**
 * Supabaseサーバークライアント設定
 * 
 * サーバーサイド（Server Components, API Routes）で使用するSupabaseクライアント
 * Next.js App Routerのcookiesを使用してセッション管理
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * サーバーコンポーネント用Supabaseクライアントを作成
 * 
 * @returns Supabaseクライアント（型安全）
 * 
 * 使用例:
 * ```typescript
 * // Server Component内
 * import { createServerClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = createServerClient();
 *   const { data } = await supabase.from('tasks').select('*');
 *   return <div>{data}</div>;
 * }
 * ```
 */
const getServerConfig = () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or API key in environment variables');
  }

  return { supabaseUrl, supabaseKey };
};

export const createServerClient = () => {
  const { supabaseUrl, supabaseKey } = getServerConfig();
  return createServerComponentClient<Database>(
    { cookies },
    { supabaseUrl, supabaseKey }
  );
};
