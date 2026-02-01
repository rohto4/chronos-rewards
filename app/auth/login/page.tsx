/**
 * ログインページ
 * Google OAuthによる認証
 */

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Chronos Rewards</h1>
          <p className="text-muted-foreground">時限別タスク管理アプリ</p>
        </div>

        <div className="task-card-glass p-8 rounded-lg space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">ログイン</h2>
            <p className="text-sm text-muted-foreground">
              Googleアカウントでログイン
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            <Chrome className="w-5 h-5" />
            {isLoading ? 'ログイン中...' : 'Googleでログイン'}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">@unibell4</p>
      </div>
    </div>
  );
}
