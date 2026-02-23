/**
 * Zustand Store: タスク管理
 *
 * タスクのCRUD操作、フィルタリング、親子関係の管理を行う
 * グローバルステート
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type {
  Database,
  Task,
  TaskUpdate,
  TaskWithGenre,
  TaskFilters,
  FilterPeriod,
  RewardHistory,
  TaskGenre,
  TaskChecklistItem,
} from '@/types/database';
import { addWeeks, addMonths, addYears, startOfDay } from 'date-fns';
import { useUserStore } from './user-store';
import { calculateTaskCreateStaminaCost } from '@/lib/utils/reward-utils';
import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';

type TaskSelectResult = Task & {
  genre: unknown;
  checklist: unknown;
};

type TaskInsertPayload = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdatePayload = Database['public']['Tables']['tasks']['Update'] & Record<string, unknown>;

type TasksTableSchema = {
  Tables: {
    tasks: {
      Row: Task & Record<string, unknown>;
      Insert: Database['public']['Tables']['tasks']['Insert'] & Record<string, unknown>;
      Update: Database['public']['Tables']['tasks']['Update'] & Record<string, unknown>;
      Relationships: never[];
    };
  };
  Views: Record<string, never>;
  Functions: Record<string, never>;
};

type TaskChecklistTableSchema = {
  Tables: {
    task_checklist: {
      Row: TaskChecklistItem & Record<string, unknown>;
      Insert: Database['public']['Tables']['task_checklist']['Insert'] & Record<string, unknown>;
      Update: Database['public']['Tables']['task_checklist']['Update'] & Record<string, unknown>;
      Relationships: never[];
    };
  };
  Views: Record<string, never>;
  Functions: Record<string, never>;
};

const TASK_SELECT_COLUMNS = `
  *,
  genre:task_genres(*),
  checklist:task_checklist(*)
`;

const tasksTable = () =>
  (supabase.from('tasks') as unknown) as PostgrestQueryBuilder<
    { PostgrestVersion: '12' },
    TasksTableSchema,
    TasksTableSchema['Tables']['tasks'],
    'tasks'
  >;

const taskChecklistTable = () =>
  (supabase.from('task_checklist') as unknown) as PostgrestQueryBuilder<
    { PostgrestVersion: '12' },
    TaskChecklistTableSchema,
    TaskChecklistTableSchema['Tables']['task_checklist'],
    'task_checklist'
  >;

function isTaskGenre(value: unknown): value is TaskGenre {
  return value != null && typeof value === 'object' && 'id' in value;
}

function isTaskChecklist(value: unknown): value is TaskChecklistItem[] {
  return Array.isArray(value);
}

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
  createTask: (task: TaskInsertPayload) => Promise<{ task: Task; coinReward: number } | null>; // タスク作成
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>; // タスク更新
  deleteTask: (id: string) => Promise<void>; // タスク削除（論理削除）
  completeTask: (id: string) => Promise<{ crystalReward: number } | null>; // タスク完了
  updateTaskChecklist: (taskId: string, itemId: string, isChecked: boolean) => Promise<void>; // チェックリスト更新

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
 * Supabaseから取得したタスク行を`TaskWithGenre`に正規化
 */
function normalizeTaskRow(task: TaskSelectResult): TaskWithGenre {
  return {
    ...task,
    genre: isTaskGenre(task.genre) ? task.genre : null,
    checklist: isTaskChecklist(task.checklist) ? task.checklist : [],
  };
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
      const { data: tasksData, error: tasksError } = await tasksTable()
        .select(TASK_SELECT_COLUMNS)
        .is('deleted_at', null) // 削除されていないタスクのみ
        .order('deadline', { ascending: true }); // 期限が近い順

      if (tasksError) throw tasksError;

      // データを TaskWithGenre 型に変換
      const taskRows = (tasksData ?? []) as unknown as TaskSelectResult[];
      const tasks: TaskWithGenre[] = taskRows.map(normalizeTaskRow);

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
   * @returns 作成されたタスク + コイン報酬額
   */
  createTask: async (task: TaskInsertPayload) => {
    set({ isLoading: true, error: null });

    try {
      // スタミナチェック（事前確認）
      const hasPrerequisites = task.has_prerequisites || false;
      const hasBenefits = task.has_benefits || false;
      const staminaCost = calculateTaskCreateStaminaCost(hasPrerequisites, hasBenefits);

      const { checkStamina } = useUserStore.getState();
      if (!checkStamina(staminaCost)) {
        throw new Error(`スタミナが不足しています（必要: ${staminaCost}）`);
      }

      // タスク作成（DBトリガーがコイン付与＋スタミナ消費を自動実行）
      const insertPayload = task as TasksTableSchema['Tables']['tasks']['Insert'];
      const { data, error } = await tasksTable()
        .insert(insertPayload)
        .select(TASK_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error('タスク作成でデータが返却されませんでした');
      }

      const taskRow = data as TaskSelectResult;

      // 最新の報酬履歴を取得（DBトリガーで挿入された報酬）
      const taskId = taskRow.id;
      if (!taskId) {
        throw new Error('未設定のタスクIDで報酬履歴をクエリできません');
      }
      const rewardTaskId = taskId as NonNullable<Database['public']['Tables']['reward_history']['Row']['task_id']>;
      const { data: rewardData, error: rewardError } = await supabase
        .from('reward_history')
        .select('*')
        .match({
          task_id: rewardTaskId,
          reward_type: 'coin',
          reason: 'task_create',
        })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (rewardError) {
        console.warn('報酬履歴取得エラー:', rewardError);
      }

      const rewardRow = rewardData as RewardHistory | null;
      const coinReward = rewardRow?.amount || 0;

      // ローカル状態を更新
      const newTask = normalizeTaskRow(taskRow);

      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));

      // フィルタを再適用
      get().applyFilters();

      // プロフィールを再取得（スタミナ＋コイン更新）
      useUserStore.getState().fetchProfile();

      return { task: newTask, coinReward };
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
      const updatePayload: TaskUpdatePayload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await tasksTable()
        .update(updatePayload)
        .eq('id', id)
        .select(TASK_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error('タスク更新でデータが返却されませんでした');
      }

      // ローカル状態を更新
      const taskRow = data as TaskSelectResult;
      const updatedTask = normalizeTaskRow(taskRow);

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
      const deletePayload: TaskUpdatePayload = {
        deleted_at: new Date().toISOString(),
      };
      const { error } = await tasksTable()
        .update(deletePayload)
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
   * @returns クリスタル報酬額
   */
  completeTask: async (id) => {
    set({ isLoading: true, error: null });

    try {
      // タスク完了（DBトリガーがクリスタル付与を自動実行）
      const completePayload: TaskUpdatePayload = {
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      };
      const { data, error } = await tasksTable()
        .update(completePayload)
        .eq('id', id)
        .select(TASK_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error('タスク完了でデータが返却されませんでした');
      }

      // 最新の報酬履歴を取得（DBトリガーで挿入された報酬）
      const rewardTaskId = id as NonNullable<Database['public']['Tables']['reward_history']['Row']['task_id']>;
      const { data: rewardData, error: rewardError } = await supabase
        .from('reward_history')
        .select('*')
        .match({
          task_id: rewardTaskId,
          reward_type: 'crystal',
          reason: 'task_complete',
        })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (rewardError) {
        console.warn('報酬履歴取得エラー:', rewardError);
      }

      const rewardRow = rewardData as RewardHistory | null;
      const crystalReward = rewardRow?.amount || 0;

      // ローカル状態を更新
      const taskRow = data as TaskSelectResult;
      const updatedTask = normalizeTaskRow(taskRow);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        isLoading: false,
      }));

      // フィルタを再適用
      get().applyFilters();

      // プロフィールを再取得（クリスタル更新）
      useUserStore.getState().fetchProfile();

      return { crystalReward };
    } catch (error) {
      console.error('タスク完了エラー:', error);
      set({
        error: error instanceof Error ? error.message : '不明なエラー',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * チェックリスト項目を更新
   *
   * @param taskId タスクID
   * @param itemId チェックリスト項目ID
   * @param isChecked チェック状態
   */
  updateTaskChecklist: async (taskId, itemId, isChecked) => {
    try {
      // task_checklistテーブルを直接更新
      const checklistPayload: TaskChecklistTableSchema['Tables']['task_checklist']['Update'] = {
        is_checked: isChecked,
        updated_at: new Date().toISOString(),
      };
      const { error } = await taskChecklistTable()
        .update(checklistPayload)
        .eq('id', itemId)
        .eq('task_id', taskId);

      if (error) throw error;

      // ローカル状態を更新（楽観的更新）
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                checklist: task.checklist?.map((item) =>
                  item.id === itemId ? { ...item, is_checked: isChecked } : item
                ),
              }
            : task
        ),
      }));

      // フィルタを再適用
      get().applyFilters();
    } catch (error) {
      console.error('チェックリスト更新エラー:', error);
      throw error;
    }
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

    // 完了済みタスクを除外
    filtered = filtered.filter((task) => !task.is_completed);

    // 期限切れフィルタの適用
    if (!filters.showOverdue) {
      filtered = filtered.filter((task) => {
        const deadline = new Date(task.deadline);
        return deadline.getTime() >= now.getTime();
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
