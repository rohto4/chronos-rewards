/**
 * Zustand Store: ユーザープロフィール
 *
 * ユーザーの認証状態、プロフィール情報、報酬（コイン/クリスタル）、
 * スタミナ情報を管理するグローバルステート
 */

// @ts-nocheck - Supabase auth-helpers type inference issue with user_profiles table
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/database';
import type { User } from '@supabase/supabase-js';
import { STAMINA_CONFIG } from '@/lib/config/game-balance';

/**
 * ユーザーストアの状態型定義
 */
interface UserStore {
  // 状態
  user: User | null; // Supabase認証ユーザー
  profile: UserProfile | null; // ユーザープロフィール
  isLoading: boolean; // ロード中フラグ
  error: string | null; // エラーメッセージ

  // アクション
  setUser: (user: User | null) => void; // ユーザー設定
  fetchProfile: () => Promise<void>; // プロフィール取得
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>; // プロフィール更新
  recoverStamina: () => Promise<void>; // スタミナ回復処理
  checkStamina: (required: number) => boolean; // スタミナ事前チェック
  signOut: () => Promise<void>; // サインアウト
}

/**
 * ユーザーストア
 * 
 * 使用例:
 * ```typescript
 * import { useUserStore } from '@/lib/stores/user-store';
 * 
 * function Component() {
 *   const { profile, fetchProfile } = useUserStore();
 *   
 *   useEffect(() => {
 *     fetchProfile();
 *   }, []);
 *   
 *   return <div>Coins: {profile?.total_coins}</div>;
 * }
 * ```
 */
export const useUserStore = create<UserStore>((set, get) => ({
  // 初期状態
  user: null,
  profile: null,
  isLoading: false,
  error: null,

  /**
   * ユーザーを設定
   * 認証状態が変更された時に呼ばれる
   */
  setUser: (user) => {
    set({ user });
    // ユーザーが存在する場合、プロフィールを取得
    if (user) {
      get().fetchProfile();
    } else {
      set({ profile: null });
    }
  },

  /**
   * プロフィールを取得
   * データベースから最新のプロフィール情報を取得
   */
  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ error: 'ユーザーが認証されていません' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // user_profilesテーブルからデータ取得
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      set({ profile: data, isLoading: false });
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * プロフィールを更新
   * 
   * @param updates 更新する項目
   */
  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user || !profile) {
      set({ error: 'ユーザーが認証されていません' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // データベースを更新
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // ローカル状態を更新
      set({ profile: data, isLoading: false });
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * スタミナ回復処理
   * データベース関数 recover_stamina() を呼び出す
   */
  recoverStamina: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // PostgreSQL関数を呼び出し
      const { data, error } = await supabase.rpc('recover_stamina', {
        p_user_id: user.id,
      });

      if (error) throw error;

      // 回復後のスタミナ値を取得
      if (typeof data === 'number') {
        // プロフィールを再取得して最新状態に更新
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('スタミナ回復エラー:', error);
    }
  },

  /**
   * スタミナ事前チェック
   * タスク作成前にスタミナが足りるかチェック
   *
   * @param required 必要なスタミナ量
   * @returns スタミナが足りればtrue
   */
  checkStamina: (required) => {
    const { profile } = get();
    if (!profile) return false;

    return profile.current_stamina >= required;
  },

  /**
   * サインアウト
   */
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null, error: null });
    } catch (error) {
      console.error('サインアウトエラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
      });
    }
  },
}));
