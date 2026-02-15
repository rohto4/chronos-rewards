# Chronos Rewards - データベース設計書
Version: 1.0  
Date: 2026-01-31  
Database: Supabase (PostgreSQL)

---

## 1. ER図（概念図）

```
┌─────────────┐
│   users     │ (Supabase Auth管理)
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│   user_profiles │ ユーザー拡張情報
└─────────────────┘

┌──────────────┐
│    tasks     │ タスク
└──────┬───────┘
       │ 1          ┌──────────────┐
       ├────────────│ task_genres  │ ジャンルマスタ
       │ N          └──────────────┘
       │
       │ 親子関係（自己参照）
       │
       │ 1
       ├────────────┐
       │ N          │
┌──────┴────────┐  │
│ task_checklist│  │ 前提条件チェックリスト
└───────────────┘  │
                   │
┌──────────────┐   │
│ reward_history│──┘ 報酬獲得履歴
└──────────────┘

┌──────────────┐
│stamina_history│ スタミナ消費履歴
└──────────────┘
```

---

## 2. テーブル定義

### 2.1 user_profiles（ユーザープロフィール）

ユーザーの拡張情報と現在のステータスを管理。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PK, FK(auth.users.id) | ユーザーID |
| display_name | text | | 表示名 |
| avatar_url | text | | アバターURL |
| total_coins | integer | NOT NULL, DEFAULT 0 | 累計コイン |
| total_crystals | integer | NOT NULL, DEFAULT 0 | 累計クリスタル |
| current_stamina | integer | NOT NULL, DEFAULT 100 | 現在のスタミナ |
| max_stamina | integer | NOT NULL, DEFAULT 100 | 最大スタミナ |
| last_stamina_recovery | timestamptz | NOT NULL, DEFAULT now() | 最終スタミナ回復時刻 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)

**RLS (Row Level Security)**:
- ユーザーは自分のプロフィールのみ参照・更新可能

---

### 2.2 task_genres（ジャンルマスタ）

ユーザーが使用したジャンルを保存し、プルダウン候補として使用。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ジャンルID |
| user_id | uuid | FK(auth.users.id), NOT NULL | ユーザーID |
| name | text | NOT NULL | ジャンル名 |
| color | text | NOT NULL, DEFAULT '#6B7280' | 表示色（HEX） |
| usage_count | integer | NOT NULL, DEFAULT 1 | 使用回数 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (user_id, name)
- INDEX (user_id, usage_count DESC) -- プルダウン表示用

**RLS**:
- ユーザーは自分のジャンルのみ参照・作成・更新可能

---

### 2.3 tasks（タスク）

メインテーブル。親子関係を自己参照外部キーで実現。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | タスクID |
| user_id | uuid | FK(auth.users.id), NOT NULL | ユーザーID |
| parent_task_id | uuid | FK(tasks.id), NULL | 親タスクID（NULL=ルート） |
| title | text | NOT NULL | タスク名 |
| description | text | | 内容（詳細説明） |
| genre_id | uuid | FK(task_genres.id), NULL | ジャンルID |
| deadline | timestamptz | NOT NULL | 期限 |
| estimated_hours | numeric(5,2) | NOT NULL, DEFAULT 1.0 | 重さ（時間） |
| benefits | text | | やるメリット |
| is_completed | boolean | NOT NULL, DEFAULT false | 完了フラグ |
| completed_at | timestamptz | | 完了日時 |
| completion_progress | integer | NOT NULL, DEFAULT 0 | 進捗率（0-100, 子タスクから自動計算） |
| detail_level | integer | NOT NULL, DEFAULT 1 | 詳細度（1-5, 報酬計算用） |
| has_prerequisites | boolean | NOT NULL, DEFAULT false | 前提条件あり |
| has_benefits | boolean | NOT NULL, DEFAULT false | メリット記入済み |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |
| deleted_at | timestamptz | | 削除日時（論理削除） |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (user_id, deleted_at, deadline) -- ダッシュボード表示用
- INDEX (parent_task_id) -- 親子関係検索用
- INDEX (user_id, is_completed, deadline) -- 未完了タスク検索用

**RLS**:
- ユーザーは自分のタスクのみ参照・作成・更新・削除可能

**計算フィールド（トリガーで自動更新）**:
- `completion_progress`: 子タスクの完了率から算出
- `detail_level`: description, benefits, checklistの充実度から算出

---

### 2.4 task_checklist（前提条件チェックリスト）

タスクの前提条件を管理。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | チェックリストID |
| task_id | uuid | FK(tasks.id) ON DELETE CASCADE, NOT NULL | タスクID |
| item_text | text | NOT NULL | チェック項目 |
| is_checked | boolean | NOT NULL, DEFAULT false | チェック状態 |
| display_order | integer | NOT NULL, DEFAULT 0 | 表示順 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (task_id, display_order) -- 表示順ソート用

**RLS**:
- タスクの所有者のみ参照・作成・更新・削除可能

---

### 2.5 reward_history（報酬獲得履歴）

コイン・クリスタル獲得履歴を記録。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 履歴ID |
| user_id | uuid | FK(auth.users.id), NOT NULL | ユーザーID |
| task_id | uuid | FK(tasks.id), NULL | 関連タスクID |
| reward_type | text | NOT NULL, CHECK IN ('coin', 'crystal') | 報酬種別 |
| amount | integer | NOT NULL | 獲得量 |
| reason | text | NOT NULL | 獲得理由（'task_create', 'task_complete', 'task_edit', etc.） |
| multiplier | numeric(3,2) | NOT NULL, DEFAULT 1.0 | 倍率 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 獲得日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (user_id, created_at DESC) -- 履歴表示用
- INDEX (user_id, reward_type, created_at DESC) -- 種別別集計用

**RLS**:
- ユーザーは自分の履歴のみ参照可能（作成はトリガー経由のみ）

---

### 2.6 stamina_history（スタミナ消費履歴）

スタミナ消費履歴を記録。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 履歴ID |
| user_id | uuid | FK(auth.users.id), NOT NULL | ユーザーID |
| task_id | uuid | FK(tasks.id), NULL | 関連タスクID |
| action_type | text | NOT NULL | アクション種別（'task_create', 'task_edit', 'daily_report', etc.） |
| stamina_cost | integer | NOT NULL | 消費量 |
| remaining_stamina | integer | NOT NULL | 残りスタミナ |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 消費日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (user_id, created_at DESC) -- 履歴表示用

**RLS**:
- ユーザーは自分の履歴のみ参照可能（作成はトリガー経由のみ）

---

## 3. ビュー（View）

### 3.1 v_task_tree（タスク階層ビュー）

親子関係を含むタスク情報をフラット化して表示。

```sql
CREATE VIEW v_task_tree AS
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
```

---

### 3.2 v_task_statistics（統計ビュー）

ユーザーごとの統計情報を集計。

```sql
CREATE VIEW v_task_statistics AS
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
```

---

## 4. データベース関数（Functions）

### 4.1 calculate_task_progress()

親タスクの進捗率を子タスクから自動計算。

```sql
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
```

---

### 4.2 calculate_detail_level()

タスクの詳細度を計算（1-5段階）。

```sql
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
```

---

### 4.3 calculate_coin_reward()

タスク立案時のコイン報酬を計算。

```sql
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
```

---

### 4.4 calculate_crystal_reward()

タスク完了時のクリスタル報酬を計算。

```sql
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
```

---

### 4.5 consume_stamina()

スタミナ消費処理。

```sql
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
```

---

### 4.6 recover_stamina()

時間経過によるスタミナ回復処理。

```sql
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
```

---

## 5. トリガー（Triggers）

### 5.1 タスク作成時の処理

```sql
CREATE OR REPLACE FUNCTION trigger_on_task_create()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  coin_reward integer;
  stamina_cost integer := 10; -- 基本コスト
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

CREATE TRIGGER task_create_trigger
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_on_task_create();
```

---

### 5.2 タスク完了時の処理

```sql
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

CREATE TRIGGER task_complete_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_on_task_complete();
```

---

### 5.3 タスク編集時の処理

```sql
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

CREATE TRIGGER task_edit_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION trigger_on_task_edit();
```

---

### 5.4 ジャンル使用回数更新

```sql
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

CREATE TRIGGER genre_usage_trigger
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_update_genre_usage();
```

---

## 6. Row Level Security (RLS) ポリシー

### 6.1 user_profiles

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 参照: 自分のプロフィールのみ
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- 更新: 自分のプロフィールのみ
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 作成: 新規ユーザー登録時のみ
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

---

### 6.2 task_genres

```sql
ALTER TABLE task_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own genres"
ON task_genres FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own genres"
ON task_genres FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genres"
ON task_genres FOR UPDATE
USING (auth.uid() = user_id);
```

---

### 6.3 tasks

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);
```

---

### 6.4 task_checklist

```sql
ALTER TABLE task_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklists"
ON task_checklist FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own checklists"
ON task_checklist FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own checklists"
ON task_checklist FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own checklists"
ON task_checklist FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_checklist.task_id
      AND tasks.user_id = auth.uid()
  )
);
```

---

### 6.5 reward_history & stamina_history

```sql
-- reward_history
ALTER TABLE reward_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reward history"
ON reward_history FOR SELECT
USING (auth.uid() = user_id);

-- stamina_history
ALTER TABLE stamina_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stamina history"
ON stamina_history FOR SELECT
USING (auth.uid() = user_id);
```

---

## 7. Realtime設定

Supabaseのリアルタイム機能を有効化するテーブル：

```sql
-- tasksテーブルのリアルタイム有効化
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_history;
```

---

## 8. 初期データ（オプション）

### 8.1 デフォルトジャンル（例）

```sql
-- ユーザー登録時に自動挿入するジャンル例（トリガーで実装可能）
-- 実装は任意
```

---

## 9. マイグレーション順序

データベース構築時の実行順序：

1. テーブル作成（外部キー依存関係順）
   - user_profiles
   - task_genres
   - tasks
   - task_checklist
   - reward_history
   - stamina_history

2. 関数作成
   - calculate_task_progress()
   - calculate_detail_level()
   - calculate_coin_reward()
   - calculate_crystal_reward()
   - consume_stamina()
   - recover_stamina()

3. トリガー作成
   - trigger_on_task_create()
   - trigger_on_task_complete()
   - trigger_on_task_edit()
   - trigger_update_genre_usage()

4. ビュー作成
   - v_task_tree
   - v_task_statistics

5. RLSポリシー設定

6. Realtime設定

---

## 10. パフォーマンス最適化メモ

- **インデックス**: 頻繁に検索されるカラムに適切なインデックスを設定済み
- **計算フィールド**: トリガーで事前計算し、読み取り時の負荷を軽減
- **論理削除**: `deleted_at`で物理削除を避け、履歴保持
- **RLS**: Supabase標準のセキュリティ機能でアクセス制御

---

## 11. 今後の拡張候補

- タグ機能（ジャンル以外の分類）
- 添付ファイル（Supabase Storage使用）
- 共有タスク（チーム機能）
- リマインダー機能
- カスタムフィールド

---

**End of Database Design Document**
