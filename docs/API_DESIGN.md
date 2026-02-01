# API設計書

Chronos RewardsのAPI設計仕様書

---

## 📋 概要

このアプリケーションは**Supabase**をバックエンドとして使用し、以下のAPIを提供します：

- **Supabase Auth API**: 認証・ユーザー管理
- **Supabase Database API**: データCRUD操作
- **Supabase Realtime API**: リアルタイム同期
- **PostgreSQL Functions**: サーバーサイド計算処理

---

## 🔐 認証API

### Google OAuth ログイン

```typescript
// クライアントサイド実装
import { supabase } from '@/lib/supabase/client';

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

**フロー:**
1. ユーザーがログインボタンクリック
2. Google OAuth画面にリダイレクト
3. 認証成功後 `/auth/callback` にリダイレクト
4. セッション確立
5. ダッシュボードに遷移

### ログアウト

```typescript
const { error } = await supabase.auth.signOut();
```

### セッション取得

```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 👤 ユーザープロフィールAPI

### プロフィール取得

```typescript
GET /user_profiles?id=eq.{userId}

// 実装例
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

**レスポンス:**
```typescript
{
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_coins: number;
  total_crystals: number;
  current_stamina: number;
  max_stamina: number;
  last_stamina_recovery: string;
  created_at: string;
  updated_at: string;
}
```

### プロフィール更新

```typescript
PATCH /user_profiles?id=eq.{userId}

// 実装例
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    display_name: '新しい名前',
    avatar_url: 'https://...',
  })
  .eq('id', userId)
  .select()
  .single();
```

### スタミナ回復

```typescript
POST /rpc/recover_stamina

// 実装例
const { data, error } = await supabase.rpc('recover_stamina', {
  p_user_id: userId,
});

// 戻り値: 回復後のスタミナ値（number）
```

**処理内容:**
1. 前回の回復時刻から経過時間を計算
2. 経過時間 × 回復速度（10pt/時間）でスタミナ回復
3. 最大値（100pt）を超えないように制限
4. 回復時刻を更新

---

## 📝 タスクAPI

### タスク一覧取得

```typescript
GET /tasks?user_id=eq.{userId}&deleted_at=is.null

// 実装例（ジャンル・チェックリスト込み）
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    genre:task_genres(*),
    checklist:task_checklist(*)
  `)
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('deadline', { ascending: true });
```

**レスポンス:**
```typescript
Task[] & {
  genre: TaskGenre | null;
  checklist: TaskChecklistItem[];
}
```

### タスク作成

```typescript
POST /tasks

// 実装例
const { data, error } = await supabase
  .from('tasks')
  .insert({
    user_id: userId,
    title: 'タスク名',
    description: '詳細説明',
    genre_id: genreId,
    deadline: '2026-02-07T15:00:00Z',
    estimated_hours: 5,
    benefits: 'メリット説明',
  })
  .select()
  .single();
```

**自動処理（トリガー）:**
1. 詳細度計算 → `detail_level` 設定
2. スタミナ消費（10-14pt）
3. コイン報酬付与（10-28コイン）
4. 報酬履歴記録

### タスク更新

```typescript
PATCH /tasks?id=eq.{taskId}

// 実装例
const { data, error } = await supabase
  .from('tasks')
  .update({
    title: '新しいタイトル',
    estimated_hours: 10,
  })
  .eq('id', taskId)
  .select()
  .single();
```

**自動処理（トリガー）:**
1. 詳細度再計算
2. 詳細度が向上した場合、ボーナスコイン付与
3. スタミナ消費（5pt）

### タスク完了

```typescript
PATCH /tasks?id=eq.{taskId}

// 実装例
const { data, error } = await supabase
  .from('tasks')
  .update({
    is_completed: true,
    completed_at: new Date().toISOString(),
  })
  .eq('id', taskId)
  .select()
  .single();
```

**自動処理（トリガー）:**
1. クリスタル報酬計算・付与（5-216個）
2. 親タスクの進捗率更新
3. 親タスク完了時は3倍ボーナス

### タスク削除（論理削除）

```typescript
PATCH /tasks?id=eq.{taskId}

// 実装例
const { data, error } = await supabase
  .from('tasks')
  .update({
    deleted_at: new Date().toISOString(),
  })
  .eq('id', taskId);
```

---

## 🏷️ ジャンルAPI

### ジャンル一覧取得

```typescript
GET /task_genres?user_id=eq.{userId}

// 実装例（使用回数順）
const { data, error } = await supabase
  .from('task_genres')
  .select('*')
  .eq('user_id', userId)
  .order('usage_count', { ascending: false });
```

### ジャンル作成

```typescript
POST /task_genres

// 実装例
const { data, error } = await supabase
  .from('task_genres')
  .insert({
    user_id: userId,
    name: 'ジャンル名',
    color: '#3B82F6',
  })
  .select()
  .single();
```

**制約:**
- `(user_id, name)` の組み合わせは一意
- 同じユーザーが同じ名前のジャンルを複数作成できない

### ジャンル使用回数の自動更新

タスク作成時に自動で `usage_count` がインクリメントされます（トリガー）。

---

## ✅ チェックリストAPI

### チェックリスト追加

```typescript
POST /task_checklist

// 実装例
const { data, error } = await supabase
  .from('task_checklist')
  .insert([
    { task_id: taskId, item_text: '項目1', display_order: 1 },
    { task_id: taskId, item_text: '項目2', display_order: 2 },
  ])
  .select();
```

### チェックリスト更新

```typescript
PATCH /task_checklist?id=eq.{itemId}

// 実装例
const { data, error } = await supabase
  .from('task_checklist')
  .update({
    is_checked: true,
  })
  .eq('id', itemId)
  .select()
  .single();
```

---

## 🎁 報酬履歴API

### 報酬履歴取得

```typescript
GET /reward_history?user_id=eq.{userId}

// 実装例（最新10件）
const { data, error } = await supabase
  .from('reward_history')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

**レスポンス:**
```typescript
{
  id: string;
  user_id: string;
  task_id: string | null;
  reward_type: 'coin' | 'crystal';
  amount: number;
  reason: string;
  multiplier: number;
  created_at: string;
}[]
```

---

## ⚡ スタミナ履歴API

### スタミナ履歴取得

```typescript
GET /stamina_history?user_id=eq.{userId}

// 実装例
const { data, error } = await supabase
  .from('stamina_history')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## 🔧 PostgreSQL関数API

### calculate_task_progress

親タスクの進捗率を計算

```typescript
POST /rpc/calculate_task_progress

const { data, error } = await supabase.rpc('calculate_task_progress', {
  parent_id: parentTaskId,
});

// 戻り値: number（0-100）
```

### calculate_coin_reward

コイン報酬を計算

```typescript
POST /rpc/calculate_coin_reward

const { data, error } = await supabase.rpc('calculate_coin_reward', {
  detail_lvl: 5,
  has_prereq: true,
  has_benefit: true,
});

// 戻り値: number（コイン数）
```

### calculate_crystal_reward

クリスタル報酬を計算

```typescript
POST /rpc/calculate_crystal_reward

const { data, error } = await supabase.rpc('calculate_crystal_reward', {
  estimated_hrs: 10,
  has_prereq: true,
  has_benefit: true,
  is_parent: false,
});

// 戻り値: number（クリスタル数）
```

### consume_stamina

スタミナを消費

```typescript
POST /rpc/consume_stamina

const { data, error } = await supabase.rpc('consume_stamina', {
  p_user_id: userId,
  p_cost: 10,
  p_action_type: 'task_create',
  p_task_id: taskId, // オプション
});

// 戻り値: boolean（成功時true、スタミナ不足時はエラー）
```

---

## 🔄 Realtime API

### タスクのリアルタイム購読

```typescript
// タスクの変更を購読
const channel = supabase
  .channel('tasks-channel')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('タスク変更検知:', payload);
      // ローカルステート更新
    }
  )
  .subscribe();

// 購読解除
channel.unsubscribe();
```

### ユーザープロフィールの購読

```typescript
const channel = supabase
  .channel('profile-channel')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_profiles',
      filter: `id=eq.${userId}`,
    },
    (payload) => {
      console.log('プロフィール更新:', payload);
      // コイン・クリスタル・スタミナ表示を更新
    }
  )
  .subscribe();
```

---

## 🔒 セキュリティ（RLS）

### Row Level Security

すべてのテーブルでRLSが有効化されています。

**ポリシー:**
```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can only access own data"
ON {table_name}
FOR ALL
USING (auth.uid() = user_id);
```

**適用テーブル:**
- `user_profiles`
- `tasks`
- `task_genres`
- `task_checklist`
- `reward_history`
- `stamina_history`

---

## ⚠️ エラーハンドリング

### 一般的なエラーコード

| エラーコード | 説明 | 対処方法 |
|------------|------|---------|
| `PGRST116` | 認証エラー | ログイン画面にリダイレクト |
| `23505` | UNIQUE制約違反 | 重複データのエラー表示 |
| `23503` | 外部キー制約違反 | 関連データの存在確認 |
| `P0001` | カスタムエラー（スタミナ不足等） | エラーメッセージを表示 |

### エラーハンドリング例

```typescript
try {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData);
  
  if (error) throw error;
  
  return data;
} catch (error: any) {
  if (error.code === 'P0001' && error.message.includes('スタミナ')) {
    // スタミナ不足エラー
    showToast('スタミナが不足しています', 'error');
  } else if (error.code === '23505') {
    // 重複エラー
    showToast('同じ名前のジャンルが既に存在します', 'error');
  } else {
    // その他のエラー
    showToast('エラーが発生しました', 'error');
    console.error(error);
  }
}
```

---

## 📊 レート制限

Supabase無料プランの制限:

- **APIリクエスト**: 500,000/月
- **データベース容量**: 500MB
- **ファイルストレージ**: 1GB
- **帯域幅**: 5GB/月
- **同時接続**: 最大60接続

**最適化のポイント:**
- クライアントサイドでキャッシュを活用
- 不要なリアルタイム購読を避ける
- バッチ処理で複数レコードを一度に操作

---

## 🔗 参考リンク

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Functions](https://supabase.com/docs/guides/database/functions)
