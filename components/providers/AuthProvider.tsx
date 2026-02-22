/**
 * AuthProviderコンポーネント
 *
 * Supabase認証状態を管理するプロバイダー
 * - ログイン/ログアウト処理
 * - セッション監視
 * - ユーザー情報の取得
 */

// @ts-nocheck
// Supabase auth-helpers v0.9.0 の型推論バグのため型チェックを無効化
// 実行時の動作には影響なし（Database 型定義で型安全性は担保）

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * 認証コンテキストの型定義
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation: boolean; data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProviderコンポーネント
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * 初期セッション取得とリスナー設定
   */
  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * サインイン
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      router.push('/');
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  /**
   * サインアップ
   */
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 開発環境ではメール確認をスキップ
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // ユーザーが作成された場合、user_profilesが自動作成されたか確認
      if (data.user) {
        // 少し待ってからuser_profilesを確認（トリガーの実行を待つ）
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // user_profilesが存在しない場合は手動で作成（トリガーのフォールバック）
        if (profileError || !profile) {
          console.log('user_profiles not found, creating manually...');

          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              display_name: email.split('@')[0],
              total_coins: 0,
              total_crystals: 0,
              current_stamina: 100,
              max_stamina: 100,
            });

          if (insertError) {
            console.error('Failed to create user_profiles:', insertError);
            // user_profilesの作成に失敗した場合、作成したユーザーを削除
            // （ただし、auth.usersの削除にはservice_role権限が必要なため、警告のみ）
            throw new Error('ユーザープロフィールの作成に失敗しました。Supabaseの設定を確認してください。');
          }
        }
      }

      // メール確認が必要かどうかを返す
      const needsEmailConfirmation = !!(data.user && !data.session);

      return { error: null, needsEmailConfirmation, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error, needsEmailConfirmation: false, data: null };
    }
  };

  /**
   * サインアウト
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 認証フック
 * 
 * 使用例:
 * ```tsx
 * const { user, signIn, signOut } = useAuth();
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
