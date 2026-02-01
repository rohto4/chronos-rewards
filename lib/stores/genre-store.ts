/**
 * Zustand Store: ジャンル管理
 * 
 * タスクジャンルの作成、取得、使用回数の管理を行う
 * グローバルステート
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { TaskGenre, TaskGenreInsert } from '@/types/database';

/**
 * ジャンルストアの状態型定義
 */
interface GenreStore {
  // 状態
  genres: TaskGenre[]; // ジャンル一覧
  isLoading: boolean; // ロード中フラグ
  error: string | null; // エラーメッセージ

  // アクション
  fetchGenres: () => Promise<void>; // ジャンル一覧取得
  createGenre: (genre: TaskGenreInsert) => Promise<TaskGenre | null>; // ジャンル作成
  getOrCreateGenre: (name: string, color?: string) => Promise<TaskGenre | null>; // 取得または作成
  updateGenre: (id: string, updates: Partial<TaskGenre>) => Promise<void>; // ジャンル更新
  deleteGenre: (id: string) => Promise<void>; // ジャンル削除

  // ユーティリティ
  getGenreByName: (name: string) => TaskGenre | undefined; // 名前で検索
  getSortedGenres: () => TaskGenre[]; // 使用回数順でソート
}

/**
 * デフォルトのジャンルカラー配列
 * ユーザーが色を指定しない場合、この中からランダムに選択
 */
const DEFAULT_COLORS = [
  '#EF4444', // 赤
  '#F59E0B', // オレンジ
  '#10B981', // 緑
  '#3B82F6', // 青
  '#8B5CF6', // 紫
  '#EC4899', // ピンク
  '#06B6D4', // シアン
  '#F97316', // 深いオレンジ
];

/**
 * ランダムな色を取得
 */
function getRandomColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

/**
 * ジャンルストア
 * 
 * 使用例:
 * ```typescript
 * import { useGenreStore } from '@/lib/stores/genre-store';
 * 
 * function GenreSelector() {
 *   const { genres, fetchGenres, getOrCreateGenre } = useGenreStore();
 *   
 *   useEffect(() => {
 *     fetchGenres();
 *   }, []);
 *   
 *   const handleSelect = async (name: string) => {
 *     const genre = await getOrCreateGenre(name);
 *     // genreを使用...
 *   };
 *   
 *   return (
 *     <select>
 *       {genres.map(g => <option key={g.id}>{g.name}</option>)}
 *     </select>
 *   );
 * }
 * ```
 */
export const useGenreStore = create<GenreStore>((set, get) => ({
  // 初期状態
  genres: [],
  isLoading: false,
  error: null,

  /**
   * ジャンル一覧を取得
   * 使用回数が多い順にソート
   */
  fetchGenres: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('task_genres')
        .select('*')
        .order('usage_count', { ascending: false }); // 使用回数が多い順

      if (error) throw error;

      set({ genres: data || [], isLoading: false });
    } catch (error) {
      console.error('ジャンル取得エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * ジャンルを作成
   * 
   * @param genre 作成するジャンル情報
   * @returns 作成されたジャンル
   */
  createGenre: async (genre) => {
    set({ isLoading: true, error: null });

    try {
      // カラーが指定されていない場合はランダムに選択
      const genreData: TaskGenreInsert = {
        ...genre,
        color: genre.color || getRandomColor(),
      };

      const { data, error } = await supabase
        .from('task_genres')
        .insert(genreData)
        .select()
        .single();

      if (error) throw error;

      // ローカル状態を更新
      set((state) => ({
        genres: [...state.genres, data],
        isLoading: false,
      }));

      return data;
    } catch (error) {
      console.error('ジャンル作成エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * ジャンルを取得または作成
   * 既に存在する場合は既存のジャンルを返し、存在しない場合は新規作成
   * 
   * @param name ジャンル名
   * @param color カラー（オプション）
   * @returns ジャンル
   */
  getOrCreateGenre: async (name, color) => {
    // 既存のジャンルを検索
    const existing = get().getGenreByName(name);
    if (existing) {
      return existing;
    }

    // 存在しない場合は新規作成
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      set({ error: 'ユーザーが認証されていません' });
      return null;
    }

    return await get().createGenre({
      user_id: userData.user.id,
      name,
      color,
    });
  },

  /**
   * ジャンルを更新
   * 
   * @param id ジャンルID
   * @param updates 更新内容
   */
  updateGenre: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('task_genres')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // ローカル状態を更新
      set((state) => ({
        genres: state.genres.map((g) => (g.id === id ? data : g)),
        isLoading: false,
      }));
    } catch (error) {
      console.error('ジャンル更新エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * ジャンルを削除
   * 
   * @param id ジャンルID
   */
  deleteGenre: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('task_genres')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // ローカル状態から削除
      set((state) => ({
        genres: state.genres.filter((g) => g.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('ジャンル削除エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * 名前でジャンルを検索
   * 
   * @param name ジャンル名
   * @returns ジャンル（存在しない場合はundefined）
   */
  getGenreByName: (name) => {
    return get().genres.find((g) => g.name === name);
  },

  /**
   * 使用回数順でソートされたジャンル一覧を取得
   * 
   * @returns ソート済みジャンル一覧
   */
  getSortedGenres: () => {
    return [...get().genres].sort((a, b) => b.usage_count - a.usage_count);
  },
}));
