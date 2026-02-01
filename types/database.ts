/**
 * Supabaseデータベース型定義
 * 
 * データベース設計書に基づいたTypeScript型定義
 * Supabase CLIの自動生成を模した構造
 */

/**
 * データベース全体の型定義
 */
export type Database = {
  public: {
    Tables: {
      // ユーザープロフィールテーブル
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      // タスクジャンルマスタ
      task_genres: {
        Row: TaskGenre;
        Insert: TaskGenreInsert;
        Update: TaskGenreUpdate;
      };
      // タスクテーブル
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
      };
      // タスク前提条件チェックリスト
      task_checklist: {
        Row: TaskChecklistItem;
        Insert: TaskChecklistItemInsert;
        Update: TaskChecklistItemUpdate;
      };
      // 報酬獲得履歴
      reward_history: {
        Row: RewardHistory;
        Insert: RewardHistoryInsert;
        Update: RewardHistoryUpdate;
      };
      // スタミナ消費履歴
      stamina_history: {
        Row: StaminaHistory;
        Insert: StaminaHistoryInsert;
        Update: StaminaHistoryUpdate;
      };
    };
    Views: {
      // タスク階層ビュー
      v_task_tree: {
        Row: TaskTreeView;
      };
      // 統計ビュー
      v_task_statistics: {
        Row: TaskStatisticsView;
      };
    };
    Functions: {
      // データベース関数の戻り値型
      calculate_task_progress: {
        Args: { parent_id: string };
        Returns: number;
      };
      calculate_coin_reward: {
        Args: {
          detail_lvl: number;
          has_prereq: boolean;
          has_benefit: boolean;
        };
        Returns: number;
      };
      calculate_crystal_reward: {
        Args: {
          estimated_hrs: number;
          has_prereq: boolean;
          has_benefit: boolean;
          is_parent: boolean;
        };
        Returns: number;
      };
      consume_stamina: {
        Args: {
          p_user_id: string;
          p_cost: number;
          p_action_type: string;
          p_task_id?: string;
        };
        Returns: boolean;
      };
      recover_stamina: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
  };
};

/**
 * ユーザープロフィール型
 */
export interface UserProfile {
  id: string; // UUID
  display_name: string | null;
  avatar_url: string | null;
  total_coins: number;
  total_crystals: number;
  current_stamina: number;
  max_stamina: number;
  last_stamina_recovery: string; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  total_coins?: number;
  total_crystals?: number;
  current_stamina?: number;
  max_stamina?: number;
  last_stamina_recovery?: string;
}

export interface UserProfileUpdate {
  display_name?: string | null;
  avatar_url?: string | null;
  total_coins?: number;
  total_crystals?: number;
  current_stamina?: number;
  max_stamina?: number;
  last_stamina_recovery?: string;
  updated_at?: string;
}

/**
 * タスクジャンル型
 */
export interface TaskGenre {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  color: string; // HEX color
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskGenreInsert {
  id?: string;
  user_id: string;
  name: string;
  color?: string;
  usage_count?: number;
}

export interface TaskGenreUpdate {
  name?: string;
  color?: string;
  usage_count?: number;
  updated_at?: string;
}

/**
 * タスク型
 */
export interface Task {
  id: string; // UUID
  user_id: string; // UUID
  parent_task_id: string | null; // UUID (nullable)
  title: string;
  description: string | null;
  genre_id: string | null; // UUID (nullable)
  deadline: string; // ISO 8601 timestamp
  estimated_hours: number; // decimal(5,2)
  benefits: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completion_progress: number; // 0-100
  detail_level: number; // 1-5
  has_prerequisites: boolean;
  has_benefits: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskInsert {
  id?: string;
  user_id: string;
  parent_task_id?: string | null;
  title: string;
  description?: string | null;
  genre_id?: string | null;
  deadline: string;
  estimated_hours?: number;
  benefits?: string | null;
  is_completed?: boolean;
  completed_at?: string | null;
  completion_progress?: number;
  detail_level?: number;
  has_prerequisites?: boolean;
  has_benefits?: boolean;
}

export interface TaskUpdate {
  parent_task_id?: string | null;
  title?: string;
  description?: string | null;
  genre_id?: string | null;
  deadline?: string;
  estimated_hours?: number;
  benefits?: string | null;
  is_completed?: boolean;
  completed_at?: string | null;
  completion_progress?: number;
  detail_level?: number;
  has_prerequisites?: boolean;
  has_benefits?: boolean;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * タスクチェックリスト型
 */
export interface TaskChecklistItem {
  id: string; // UUID
  task_id: string; // UUID
  item_text: string;
  is_checked: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistItemInsert {
  id?: string;
  task_id: string;
  item_text: string;
  is_checked?: boolean;
  display_order?: number;
}

export interface TaskChecklistItemUpdate {
  item_text?: string;
  is_checked?: boolean;
  display_order?: number;
  updated_at?: string;
}

/**
 * 報酬履歴型
 */
export interface RewardHistory {
  id: string; // UUID
  user_id: string; // UUID
  task_id: string | null; // UUID (nullable)
  reward_type: 'coin' | 'crystal';
  amount: number;
  reason: string;
  multiplier: number; // decimal(3,2)
  created_at: string;
}

export interface RewardHistoryInsert {
  id?: string;
  user_id: string;
  task_id?: string | null;
  reward_type: 'coin' | 'crystal';
  amount: number;
  reason: string;
  multiplier?: number;
}

export interface RewardHistoryUpdate {
  // 履歴は基本的に更新しない（読み取り専用）
  // 必要に応じて追加
}

/**
 * スタミナ履歴型
 */
export interface StaminaHistory {
  id: string; // UUID
  user_id: string; // UUID
  task_id: string | null; // UUID (nullable)
  action_type: string;
  stamina_cost: number;
  remaining_stamina: number;
  created_at: string;
}

export interface StaminaHistoryInsert {
  id?: string;
  user_id: string;
  task_id?: string | null;
  action_type: string;
  stamina_cost: number;
  remaining_stamina: number;
}

export interface StaminaHistoryUpdate {
  // 履歴は基本的に更新しない（読み取り専用）
}

/**
 * タスク階層ビュー型
 */
export interface TaskTreeView {
  id: string;
  user_id: string;
  parent_task_id: string | null;
  title: string;
  deadline: string;
  is_completed: boolean;
  completion_progress: number;
  genre_name: string | null;
  genre_color: string | null;
  depth: number; // 階層の深さ（0がルート）
  path: string[]; // タスクIDの配列（パス）
}

/**
 * タスク統計ビュー型
 */
export interface TaskStatisticsView {
  user_id: string;
  completed_count: number;
  active_count: number;
  overdue_count: number;
  total_completed_hours: number;
  genre_count: number;
}

/**
 * フィルタ期間の型定義
 */
export type FilterPeriod = 
  | 'today' 
  | 'this_week' 
  | 'two_weeks' 
  | 'one_month' 
  | 'three_months' 
  | 'one_year' 
  | 'three_years';

/**
 * フィルタ状態の型定義
 */
export interface TaskFilters {
  periods: FilterPeriod[]; // 選択中の期間フィルタ
  showOverdue: boolean; // 期限切れタスクの表示
  genres: string[]; // 選択中のジャンルID
}

/**
 * タスクとジャンル情報を結合した型
 */
export interface TaskWithGenre extends Task {
  genre: TaskGenre | null;
  checklist: TaskChecklistItem[];
  childTasks?: TaskWithGenre[]; // 子タスク（階層表示用）
}

/**
 * ユーティリティ型：Nullable型のヘルパー
 */
export type Nullable<T> = T | null;

/**
 * ユーティリティ型：タイムスタンプ型
 */
export type Timestamp = string; // ISO 8601 format

/**
 * エクスポート：よく使う型の再エクスポート
 */
export type {
  Database as SupabaseDatabase,
};
