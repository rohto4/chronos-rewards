-- ================================================
-- Chronos Rewards - Database Migration Script
-- Version: 1.0
-- Date: 2026-01-31
-- 
-- 実行方法:
-- 1. Supabase Dashboard > SQL Editor
-- 2. このファイルの内容を貼り付け
-- 3. "Run"をクリック
-- ================================================

-- ================================================
-- SECTION 1: Extensions
-- ================================================
-- UUID生成用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- SECTION 2: Tables
-- ================================================

-- 2.1 user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  total_coins integer NOT NULL DEFAULT 0,
  total_crystals integer NOT NULL DEFAULT 0,
  current_stamina integer NOT NULL DEFAULT 100,
  max_stamina integer NOT NULL DEFAULT 100,
  last_stamina_recovery timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_profiles IS 'ユーザーの拡張情報と現在のステータス';

-- 2.2 task_genres
CREATE TABLE IF NOT EXISTS task_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_task_genres_user_usage 
ON task_genres(user_id, usage_count DESC);

COMMENT ON TABLE task_genres IS 'ユーザーが使用したジャンルマスタ';

-- 2.3 tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  genre_id uuid REFERENCES task_genres(id) ON DELETE SET NULL,
  deadline timestamptz NOT NULL,
  estimated_hours numeric(5,2) NOT NULL DEFAULT 1.0,
  benefits text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completion_progress integer NOT NULL DEFAULT 0,
  detail_level integer NOT NULL DEFAULT 1,
  has_prerequisites boolean NOT NULL DEFAULT false,
  has_benefits boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  CONSTRAINT chk_completion_progress CHECK (completion_progress >= 0 AND completion_progress <= 100),
  CONSTRAINT chk_detail_level CHECK (detail_level >= 1 AND detail_level <= 5),
  CONSTRAINT chk_estimated_hours CHECK (estimated_hours > 0)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_deadline 
ON tasks(user_id, deleted_at, deadline);

CREATE INDEX IF NOT EXISTS idx_tasks_parent 
ON tasks(parent_task_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_active 
ON tasks(user_id, is_completed, deadline);

COMMENT ON TABLE tasks IS 'タスクメインテーブル（親子関係を自己参照で実現）';

-- 2.4 task_checklist
CREATE TABLE IF NOT EXISTS task_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  is_checked boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_task_order 
ON task_checklist(task_id, display_order);

COMMENT ON TABLE task_checklist IS 'タスクの前提条件チェックリスト';

-- 2.5 reward_history
CREATE TABLE IF NOT EXISTS reward_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('coin', 'crystal')),
  amount integer NOT NULL,
  reason text NOT NULL,
  multiplier numeric(3,2) NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_history_user_time 
ON reward_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_history_user_type_time 
ON reward_history(user_id, reward_type, created_at DESC);

COMMENT ON TABLE reward_history IS 'コイン・クリスタル獲得履歴';

-- 2.6 stamina_history
CREATE TABLE IF NOT EXISTS stamina_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  stamina_cost integer NOT NULL,
  remaining_stamina integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stamina_history_user_time 
ON stamina_history(user_id, created_at DESC);

COMMENT ON TABLE stamina_history IS 'スタミナ消費履歴';

-- ================================================
-- SECTION 3: Functions
-- ================================================

-- 3.1 親タスクの進捗率計算
CREATE OR REPLACE FUNCTION calculate_task_progress(parent_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  total_children integer;
  completed_children integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_children, completed_children
  FROM tasks
  WHERE parent_task_id = parent_id
    AND deleted_at IS NULL;

  IF total_children = 0 THEN
    RETURN 0;
  END IF;

  RETURN (completed_children * 100 / total_children);
END;
$$;

-- 3.2 タスクの詳細度計算
CREATE OR REPLACE FUNCTION calculate_detail_level(task_record tasks)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  level integer := 1;
  checklist_count integer;
BEGIN
  -- 内容（description）があれば +1
  IF task_record.description IS NOT NULL AND length(task_record.description) > 10 THEN
    level := level + 1;
  END IF;

  -- メリット（benefits）があれば +1
  IF task_record.benefits IS NOT NULL AND length(task_record.benefits) > 10 THEN
    level := level + 1;
  END IF;

  -- 前提条件（checklist）が3つ以上あれば +1
  SELECT COUNT(*)
  INTO checklist_count
  FROM task_checklist
  WHERE task_id = task_record.id;

  IF checklist_count >= 3 THEN
    level := level + 1;
  END IF;

  -- estimated_hoursが10h以上なら +1（長期タスク）
  IF task_record.estimated_hours >= 10 THEN
    level := level + 1;
  END IF;

  -- 最大5
  RETURN LEAST(level, 5);
END;
$$;

-- 3.3 コイン報酬計算
CREATE OR REPLACE FUNCTION calculate_coin_reward(
  detail_lvl integer,
  has_prereq boolean,
  has_benefit boolean
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  base_coin integer := 10;
  multiplier numeric := 1.0;
BEGIN
  -- 詳細度による倍率（1-5 → 1.0-2.0倍）
  multiplier := multiplier + ((detail_lvl - 1) * 0.25);

  -- 前提条件ボーナス
  IF has_prereq THEN
    multiplier := multiplier * 1.2;
  END IF;

  -- メリットボーナス
  IF has_benefit THEN
    multiplier := multiplier * 1.2;
  END IF;

  RETURN FLOOR(base_coin * multiplier);
END;
$$;

-- 3.4 クリスタル報酬計算
CREATE OR REPLACE FUNCTION calculate_crystal_reward(
  estimated_hrs numeric,
  has_prereq boolean,
  has_benefit boolean,
  is_parent boolean
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  base_crystal integer;
  multiplier numeric := 1.0;
BEGIN
  -- 基本クリスタル = 時間 * 5
  base_crystal := FLOOR(estimated_hrs * 5);

  -- 前提条件・メリットボーナス
  IF has_prereq THEN
    multiplier := multiplier * 1.2;
  END IF;

  IF has_benefit THEN
    multiplier := multiplier * 1.2;
  END IF;

  -- 親タスク完了ボーナス（3倍）
  IF is_parent THEN
    multiplier := multiplier * 3.0;
  END IF;

  RETURN FLOOR(base_crystal * multiplier);
END;
$$;

-- 3.5 スタミナ消費
CREATE OR REPLACE FUNCTION consume_stamina(
  p_user_id uuid,
  p_cost integer,
  p_action_type text,
  p_task_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_stam integer;
BEGIN
  -- 現在のスタミナを取得
  SELECT current_stamina INTO current_stam
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- スタミナ不足チェック
  IF current_stam < p_cost THEN
    RAISE EXCEPTION 'スタミナが不足しています（必要: %, 現在: %）', p_cost, current_stam;
    RETURN false;
  END IF;

  -- スタミナ消費
  UPDATE user_profiles
  SET current_stamina = current_stamina - p_cost,
      updated_at = now()
  WHERE id = p_user_id;

  -- 履歴記録
  INSERT INTO stamina_history (user_id, task_id, action_type, stamina_cost, remaining_stamina)
  VALUES (p_user_id, p_task_id, p_action_type, p_cost, current_stam - p_cost);

  RETURN true;
END;
$$;

-- 3.6 スタミナ回復
CREATE OR REPLACE FUNCTION recover_stamina(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  last_recovery timestamptz;
  current_stam integer;
  max_stam integer;
  hours_passed numeric;
  recovery_amount integer;
BEGIN
  -- ユーザー情報取得
  SELECT last_stamina_recovery, current_stamina, max_stamina
  INTO last_recovery, current_stam, max_stam
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- 経過時間（時間単位）
  hours_passed := EXTRACT(EPOCH FROM (now() - last_recovery)) / 3600.0;

  -- 回復量計算（1時間で10回復）
  recovery_amount := FLOOR(hours_passed * 10);

  IF recovery_amount > 0 THEN
    -- スタミナ更新（最大値を超えない）
    UPDATE user_profiles
    SET current_stamina = LEAST(current_stamina + recovery_amount, max_stamina),
        last_stamina_recovery = now(),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN LEAST(current_stam + recovery_amount, max_stam);
  END IF;

  RETURN current_stam;
END;
$$;

-- ================================================
-- SECTION 4: Triggers
-- ================================================

-- 4.1 タスク作成時の処理
CREATE OR REPLACE FUNCTION trigger_on_task_create()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  coin_reward integer;
  stamina_cost integer := 10;
BEGIN
  -- 詳細度計算
  NEW.detail_level := calculate_detail_level(NEW);
  NEW.has_prerequisites := EXISTS(SELECT 1 FROM task_checklist WHERE task_id = NEW.id);
  NEW.has_benefits := (NEW.benefits IS NOT NULL AND length(NEW.benefits) > 0);

  -- 前提条件・メリット追加でスタミナ追加消費
  IF NEW.has_prerequisites THEN
    stamina_cost := stamina_cost + 2;
  END IF;
  IF NEW.has_benefits THEN
    stamina_cost := stamina_cost + 2;
  END IF;

  -- スタミナ消費
  PERFORM consume_stamina(NEW.user_id, stamina_cost, 'task_create', NEW.id);

  -- コイン報酬計算・付与
  coin_reward := calculate_coin_reward(NEW.detail_level, NEW.has_prerequisites, NEW.has_benefits);
  
  INSERT INTO reward_history (user_id, task_id, reward_type, amount, reason, multiplier)
  VALUES (NEW.user_id, NEW.id, 'coin', coin_reward, 'task_create', 1.0);

  UPDATE user_profiles
  SET total_coins = total_coins + coin_reward,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_create_trigger ON tasks;
CREATE TRIGGER task_create_trigger
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_on_task_create();

-- 4.2 タスク完了時の処理
CREATE OR REPLACE FUNCTION trigger_on_task_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  crystal_reward integer;
  is_parent_task boolean;
BEGIN
  -- 完了フラグがtrueに変更された場合のみ
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at := now();
    NEW.completion_progress := 100;

    -- 親タスクかチェック
    is_parent_task := EXISTS(SELECT 1 FROM tasks WHERE parent_task_id = NEW.id);

    -- クリスタル報酬計算・付与
    crystal_reward := calculate_crystal_reward(
      NEW.estimated_hours,
      NEW.has_prerequisites,
      NEW.has_benefits,
      is_parent_task
    );

    INSERT INTO reward_history (user_id, task_id, reward_type, amount, reason, multiplier)
    VALUES (NEW.user_id, NEW.id, 'crystal', crystal_reward, 'task_complete', 1.0);

    UPDATE user_profiles
    SET total_crystals = total_crystals + crystal_reward,
        updated_at = now()
    WHERE id = NEW.user_id;

    -- 親タスクの進捗更新
    IF NEW.parent_task_id IS NOT NULL THEN
      UPDATE tasks
      SET completion_progress = calculate_task_progress(NEW.parent_task_id),
          updated_at = now()
      WHERE id = NEW.parent_task_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_complete_trigger ON tasks;
CREATE TRIGGER task_complete_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_on_task_complete();

-- 4.3 タスク編集時の処理
CREATE OR REPLACE FUNCTION trigger_on_task_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_detail integer;
  new_detail integer;
  coin_bonus integer;
BEGIN
  -- 完了済みタスクは編集不可
  IF OLD.is_completed = true THEN
    RAISE EXCEPTION 'タスクが既に完了しているため編集できません';
  END IF;

  -- 詳細度再計算
  old_detail := OLD.detail_level;
  new_detail := calculate_detail_level(NEW);
  NEW.detail_level := new_detail;

  -- 詳細度が向上した場合、追加コイン付与
  IF new_detail > old_detail THEN
    coin_bonus := (new_detail - old_detail) * 5;

    -- スタミナ消費
    PERFORM consume_stamina(NEW.user_id, 5, 'task_edit', NEW.id);

    INSERT INTO reward_history (user_id, task_id, reward_type, amount, reason, multiplier)
    VALUES (NEW.user_id, NEW.id, 'coin', coin_bonus, 'task_edit', 1.0);

    UPDATE user_profiles
    SET total_coins = total_coins + coin_bonus,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_edit_trigger ON tasks;
CREATE TRIGGER task_edit_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION trigger_on_task_edit();

-- 4.4 ジャンル使用回数更新
CREATE OR REPLACE FUNCTION trigger_update_genre_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.genre_id IS NOT NULL THEN
    UPDATE task_genres
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = NEW.genre_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS genre_usage_trigger ON tasks;
CREATE TRIGGER genre_usage_trigger
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_update_genre_usage();

-- ================================================
-- SECTION 5: Views
-- ================================================

-- 5.1 タスク階層ビュー
CREATE OR REPLACE VIEW v_task_tree AS
WITH RECURSIVE task_hierarchy AS (
  -- ルートタスク（親なし）
  SELECT
    t.id,
    t.user_id,
    t.parent_task_id,
    t.title,
    t.deadline,
    t.is_completed,
    t.completion_progress,
    g.name as genre_name,
    g.color as genre_color,
    0 as depth,
    ARRAY[t.id] as path
  FROM tasks t
  LEFT JOIN task_genres g ON t.genre_id = g.id
  WHERE t.parent_task_id IS NULL
    AND t.deleted_at IS NULL

  UNION ALL

  -- 子タスク
  SELECT
    t.id,
    t.user_id,
    t.parent_task_id,
    t.title,
    t.deadline,
    t.is_completed,
    t.completion_progress,
    g.name as genre_name,
    g.color as genre_color,
    th.depth + 1,
    th.path || t.id
  FROM tasks t
  JOIN task_hierarchy th ON t.parent_task_id = th.id
  LEFT JOIN task_genres g ON t.genre_id = g.id
  WHERE t.deleted_at IS NULL
)
SELECT * FROM task_hierarchy;

-- 5.2 統計ビュー
CREATE OR REPLACE VIEW v_task_statistics AS
SELECT
  t.user_id,
  COUNT(*) FILTER (WHERE t.is_completed = true) as completed_count,
  COUNT(*) FILTER (WHERE t.is_completed = false AND t.deadline >= now()) as active_count,
  COUNT(*) FILTER (WHERE t.is_completed = false AND t.deadline < now()) as overdue_count,
  SUM(t.estimated_hours) FILTER (WHERE t.is_completed = true) as total_completed_hours,
  COUNT(DISTINCT t.genre_id) as genre_count
FROM tasks t
WHERE t.deleted_at IS NULL
GROUP BY t.user_id;

-- ================================================
-- SECTION 6: Row Level Security (RLS)
-- ================================================

-- 6.1 user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6.2 task_genres
ALTER TABLE task_genres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own genres" ON task_genres;
CREATE POLICY "Users can view own genres"
ON task_genres FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own genres" ON task_genres;
CREATE POLICY "Users can insert own genres"
ON task_genres FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own genres" ON task_genres;
CREATE POLICY "Users can update own genres"
ON task_genres FOR UPDATE
USING (auth.uid() = user_id);

-- 6.3 tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);

-- 6.4 task_checklist
ALTER TABLE task_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checklists" ON task_checklist;
CREATE POLICY "Users can view own checklists"
ON task_checklist FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own checklists" ON task_checklist;
CREATE POLICY "Users can insert own checklists"
ON task_checklist FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own checklists" ON task_checklist;
CREATE POLICY "Users can update own checklists"
ON task_checklist FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own checklists" ON task_checklist;
CREATE POLICY "Users can delete own checklists"
ON task_checklist FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

-- 6.5 reward_history
ALTER TABLE reward_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reward history" ON reward_history;
CREATE POLICY "Users can view own reward history"
ON reward_history FOR SELECT
USING (auth.uid() = user_id);

-- 6.6 stamina_history
ALTER TABLE stamina_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stamina history" ON stamina_history;
CREATE POLICY "Users can view own stamina history"
ON stamina_history FOR SELECT
USING (auth.uid() = user_id);

-- ================================================
-- SECTION 7: Realtime Configuration
-- ================================================

-- Realtimeを有効化するテーブル
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_history;

-- ================================================
-- SECTION 8: User Registration Trigger
-- ================================================

-- 新規ユーザー登録時に自動でuser_profilesを作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- END OF MIGRATION
-- ================================================

-- 確認用クエリ（実行後に確認）
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
