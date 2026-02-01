/**
 * Zustand Store: タスク管理
 * 
 * タスクのCRUD操作、フィルタリング、親子関係の管理を行う
 * グローバルステート
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type {
  Task,
  TaskInsert,
  TaskUpdate,
  TaskWithGenre,
  TaskFilters,
  FilterPeriod,
} from '@/types/database';
import { addDays, addWeeks, addMonths, addYears, startOfDay } from 'date-fns';

/**
 * タスクストアの状態型定義
 */
interface TaskStore {
  // 状態
  tasks: TaskWithGenre[]; // タスク一覧
  filteredTasks: TaskWithGenre[]; // フィルタ後のタスク一覧
  filters: TaskFilters; // フィルタ設定
  isLoading: boolean; // ロード中フラグ
  error: string | null; // エラーメッセージ

  // アクション: CRUD操作
  fetchTasks: () => Promise<void>; // タスク一覧取得
  createTask: (task: TaskInsert) => Promise<Task | null>; // タスク作成
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>; // タスク更新
  deleteTask: (id: string) => Promise<void>; // タスク削除（論理削除）
  completeTask: (id: string) => Promise<void>; // タスク完了

  // アクション: フィルタリング
  setFilters: (filters: Partial<TaskFilters>) => void; // フィルタ設定
  togglePeriodFilter: (period: FilterPeriod) => void; // 期間フィルタトグル
  toggleGenreFilter: (genreId: string) => void; // ジャンルフィルタトグル
  applyFilters: () => void; // フィルタ適用

  // アクション: ユーティリティ
  getTaskById: (id: string) => TaskWithGenre | undefined; // ID検索
  getChildTasks: (parentId: string) => TaskWithGenre[]; // 子タスク取得
}

/**
 * 期間フィルタから日付範囲を計算
 * 
 * @param period フィルタ期間
 * @returns 期限の日付（今日から何日後か）
 */
function getPeriodDate(period: FilterPeriod): Date {
  const today = startOfDay(new Date());
  
  switch (period) {
    case 'today':
      return today;
    case 'this_week':
      return addWeeks(today, 1);
    case 'two_weeks':
      return addWeeks(today, 2);
    case 'one_month':
      return addMonths(today, 1);
    case 'three_months':
      return addMonths(today, 3);
    case 'one_year':
      return addYears(today, 1);
    case 'three_years':
      return addYears(today, 3);
    default:
      return addYears(today, 3);
  }
}

/**
 * タスクストア
 * 
 * 使用例:
 * ```typescript
 * import { useTaskStore } from '@/lib/stores/task-store';
 * 
 * function TaskList() {
 *   const { filteredTasks, fetchTasks, completeTask } = useTaskStore();
 *   
 *   useEffect(() => {
 *     fetchTasks();
 *   }, []);
 *   
 *   return (
 *     <div>
 *       {filteredTasks.map(task => (
 *         <TaskCard key={task.id} task={task} onComplete={completeTask} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTaskStore = create<TaskStore>((set, get) => ({
  // 初期状態
  tasks: [],
  filteredTasks: [],
  filters: {
    periods: ['this_week'], // デフォルトで「今週」を選択
    showOverdue: false, // 期限切れは非表示
    genres: [], // すべてのジャンル
  },
  isLoading: false,
  error: null,

  /**
   * タスク一覧を取得
   * ジャンル情報とチェックリストも一緒に取得
   */
  fetchTasks: async () => {
    set({ isLoading: true, error: null });

    try {
      // タスクをジャンル、チェックリストと一緒に取得
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          genre:task_genres(*),
          checklist:task_checklist(*)
        `)
        .is('deleted_at', null) // 削除されていないタスクのみ
        .order('deadline', { ascending: true }); // 期限が近い順

      if (tasksError) throw tasksError;

      // データを TaskWithGenre 型に変換
      const tasks: TaskWithGenre[] = (tasksData || []).map((task) => ({
        ...task,
        genre: task.genre || null,
        checklist: task.checklist || [],
      }));

      set({ tasks, isLoading: false });
      
      // フィルタを適用
      get().applyFilters();
    } catch (error) {
      console.error('タスク取得エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * タスクを作成
   * 
   * @param task 作成するタスク情報
   * @returns 作成されたタスク
   */
  createTask: async (task) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select(`
          *,
          genre:task_genres(*),
          checklist:task_checklist(*)
        `)
        .single();

      if (error) throw error;

      // ローカル状態を更新
      const newTask: TaskWithGenre = {
        ...data,
        genre: data.genre || null,
        checklist: data.checklist || [],
      };

      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));

      // フィルタを再適用
      get().applyFilters();

      return data;
    } catch (error) {
      console.error('タスク作成エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * タスクを更新
   * 
   * @param id タスクID
   * @param updates 更新内容
   */
  updateTask: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          genre:task_genres(*),
          checklist:task_checklist(*)
        `)
        .single();

      if (error) throw error;

      // ローカル状態を更新
      const updatedTask: TaskWithGenre = {
        ...data,
        genre: data.genre || null,
        checklist: data.checklist || [],
      };

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        isLoading: false,
      }));

      // フィルタを再適用
      get().applyFilters();
    } catch (error) {
      console.error('タスク更新エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * タスクを削除（論理削除）
   * 
   * @param id タスクID
   */
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // ローカル状態から削除
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        isLoading: false,
      }));

      // フィルタを再適用
      get().applyFilters();
    } catch (error) {
      console.error('タスク削除エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
    }
  },

  /**
   * タスクを完了
   * 
   * @param id タスクID
   */
  completeTask: async (id) => {
    await get().updateTask(id, {
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
  },

  /**
   * フィルタ設定を更新
   * 
   * @param filters 更新するフィルタ設定
   */
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    get().applyFilters();
  },

  /**
   * 期間フィルタをトグル
   * 既に選択されていれば削除、されていなければ追加
   * 
   * @param period トグルする期間
   */
  togglePeriodFilter: (period) => {
    set((state) => {
      const periods = state.filters.periods.includes(period)
        ? state.filters.periods.filter((p) => p !== period)
        : [...state.filters.periods, period];

      return {
        filters: { ...state.filters, periods },
      };
    });
    get().applyFilters();
  },

  /**
   * ジャンルフィルタをトグル
   * 
   * @param genreId トグルするジャンルID
   */
  toggleGenreFilter: (genreId) => {
    set((state) => {
      const genres = state.filters.genres.includes(genreId)
        ? state.filters.genres.filter((g) => g !== genreId)
        : [...state.filters.genres, genreId];

      return {
        filters: { ...state.filters, genres },
      };
    });
    get().applyFilters();
  },

  /**
   * フィルタを適用してfilteredTasksを更新
   */
  applyFilters: () => {
    const { tasks, filters } = get();
    const now = new Date();

    let filtered = [...tasks];

    // 期間フィルタの適用
    if (filters.periods.length > 0) {
      // 選択された期間のうち、最も遠い日付を取得
      const maxDate = Math.max(
        ...filters.periods.map((period) => getPeriodDate(period).getTime())
      );

      filtered = filtered.filter((task) => {
        const deadline = new Date(task.deadline);
        return deadline.getTime() <= maxDate;
      });
    }

    // 期限切れフィルタの適用
    if (!filters.showOverdue) {
      filtered = filtered.filter((task) => {
        const deadline = new Date(task.deadline);
        return task.is_completed || deadline.getTime() >= now.getTime();
      });
    }

    // ジャンルフィルタの適用
    if (filters.genres.length > 0) {
      filtered = filtered.filter((task) =>
        task.genre_id ? filters.genres.includes(task.genre_id) : false
      );
    }

    // 期限が近い順にソート
    filtered.sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    set({ filteredTasks: filtered });
  },

  /**
   * IDでタスクを取得
   * 
   * @param id タスクID
   * @returns タスク（存在しない場合はundefined）
   */
  getTaskById: (id) => {
    return get().tasks.find((task) => task.id === id);
  },

  /**
   * 子タスクを取得
   * 
   * @param parentId 親タスクID
   * @returns 子タスクの配列
   */
  getChildTasks: (parentId) => {
    return get().tasks.filter((task) => task.parent_task_id === parentId);
  },
}));
