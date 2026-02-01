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
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
};
