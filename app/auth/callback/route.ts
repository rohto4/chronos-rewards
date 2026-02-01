/**
 * OAuth コールバックルート
 * 
 * Google OAuth認証後のリダイレクト先
 * 認証コードをトークンに交換してセッションを確立
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerClient();

    // 認証コードをセッショントークンに交換
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ダッシュボードにリダイレクト
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
