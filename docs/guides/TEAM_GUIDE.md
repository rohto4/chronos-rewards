# チーム開発運用ガイド

**対象**: OhMyOpenCode（opencode-cli）によるチーム開発
**最終更新**: 2026-02-23

---

## 📚 必読ファイル

```
1. docs/README.md
2. docs/guides/AGENT.md（最重要）
3. docs/guides/DDD.md
4. docs/guides/tech-stack.md
5. docs/PROJECT.md（プロジェクト固有設定、無ければスキップ）
6. docs/guides/TEAM_GUIDE.md（このファイル）
7. docs/implementation/implementation-plan.md
8. docs/implementation/IMPLEMENTATION_STATUS.md
9. docs/guides/MODEL_USAGE.md
10. docs/implementation/active-tasks.json
```

---

## 🚀 チーム開発開始フロー

### プロジェクト設定を用意
```
# 1. 設定ファイルの確認
<プロジェクトルート>/ohmyopencode-config.json が存在すること
<プロジェクトルート>/docs/guides/AGENT.md を最新化しておくこと

# 2. タスク管理ファイルを用意
mkdir -p docs/implementation
cat > docs/implementation/active-tasks.json <<'EOF'
{
  "tasks": []
}
EOF
```

### opencode-cli で開始
```
# 3. 必読ガイドを読み込み
@docs/guides/AGENT.md
@docs/guides/TEAM_GUIDE.md
@docs/PROJECT.md（プロジェクト固有設定、なかったらスキップ）

# 4. チーム開発を開始
/start-work
```

---

## ✅ タスク管理（重要）

### タスク共有ファイル

```
docs/implementation/
└── active-tasks.json
```

テスト運用時は `docs/implementation/active-tasks.test.json` を使用。

### active-tasks.json の構造

`docs/implementation/active-tasks.json`

```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "記事詳細ページ実装",
      "description": "記事詳細ページのコンポーネント作成、目次生成、関連記事表示を実装",
      "status": "pending",
      "assignedTo": null,
      "priority": "high",
      "feature": "posts",
      "estimatedDuration": "2h",
      "createdAt": "2026-02-15T10:00:00Z"
    },
    {
      "id": "task-002",
      "title": "Google OAuth認証実装",
      "description": "Supabase Authを使用したGoogle OAuth認証フローを実装",
      "status": "in_progress",
      "assignedTo": "agent-2",
      "priority": "high",
      "feature": "auth",
      "estimatedDuration": "3h",
      "createdAt": "2026-02-15T09:00:00Z",
      "startedAt": "2026-02-15T09:30:00Z"
    },
    {
      "id": "task-003",
      "title": "プロジェクト一覧ページ実装",
      "description": "プロジェクト一覧ページとフィルタリング機能を実装",
      "status": "completed",
      "assignedTo": "agent-1",
      "priority": "medium",
      "feature": "projects",
      "estimatedDuration": "2h",
      "createdAt": "2026-02-15T08:00:00Z",
      "startedAt": "2026-02-15T08:30:00Z",
      "completedAt": "2026-02-15T10:15:00Z"
    }
  ]
}
```

**フィールド説明**:
- `id`: タスクの一意な識別子
- `title`: タスクのタイトル
- `description`: タスクの詳細説明
- `status`: タスクの状態 (`pending` / `in_progress` / `completed`)
- `assignedTo`: 担当エージェントID（未割り当ての場合は `null`）
- `priority`: 優先度 (`high` / `medium` / `low`)
- `feature`: 関連する機能名（任意）
- `estimatedDuration`: 推定所要時間
- `createdAt`: タスク作成日時
- `startedAt`: タスク開始日時（オプション）
- `completedAt`: タスク完了日時（オプション）

---

## 🚦 作業開始前のルール（エージェント向け）

### STEP 1: タスク選択

```bash
# 1. active-tasks.json を読む
cat docs/implementation/active-tasks.json

# 2. status が "pending" かつ assignedTo が null のタスクを探す
# 3. 優先度（priority）が高いものから選ぶ
# 4. 自分のエージェントIDを assignedTo に設定
# 5. status を "in_progress" に変更
# 6. startedAt を追加
```

優先順位: 高 🔥 → 中 🟡 → 低 ⏸️

### STEP 2: 着手宣言

```bash
# active-tasks.json を更新（assignedTo/status/startedAt）
git add docs/implementation/active-tasks.json
git commit -m "chore: assign task {task-id} to {agent-id}"
git push
```

### STEP 3: タスクが無い場合の対応

- pending が無い場合は優先度の高い新規タスクを追加
- in_progress が長時間停滞している場合は担当者に確認して再割り当て

---

## ✅ 作業完了後のルール（エージェント向け）

### STEP 1: タスク完了の更新

```bash
# active-tasks.json の該当タスクを "status": "completed" に変更
# completedAt を追加

git add docs/implementation/active-tasks.json
git commit -m "docs: complete task {task-id}"
git push
```

### STEP 1-1: 所要時間の集計（任意）

```bash
# active-tasks.json の startedAt / completedAt から所要時間を集計
npm run tasks:summary
```

### STEP 2: 実装状況ドキュメントの更新

```markdown
# docs/implementation/{feature-id}-feature.md を更新

## ✅ 実装完了機能
### X. {実装した機能名}
- ✅ 機能A実装完了
- ✅ 機能B実装完了

## 📝 実装メモ
- 実装日: 2026-02-15
- 担当エージェント: agent-1
- 所要時間: 2時間
- 参考にした実装: ...
```

---

## 📋 実装手順

### STEP 1: ドキュメント確認

```bash
# 担当機能のドキュメントを読む
cat docs/implementation/{feature-id}-feature.md

# 次のステップを確認
# → "🎯 次のステップ" セクションを参照
```

### STEP 2: タスク着手の記録

```bash
# active-tasks.json の該当タスクを in_progress に更新（前述の手順）
```

### STEP 3: 実装

```bash
# 実装例を参考にコード生成
# 例: docs/implementation/01-posts-feature.md の "💡 実装のヒント" セクション

# 必要なファイル:
# - src/app/(public)/posts/[slug]/page.tsx
# - src/components/posts/PostContent.tsx
# - src/components/posts/TableOfContents.tsx
```

### STEP 4: テスト

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npx tsc --noEmit

# Lint
npm run lint

# 動作確認
# → ブラウザで該当ページを開いて確認
```

### STEP 5: コミット

```bash
git add .
git commit -m "feat: 記事詳細ページ実装完了

- PostContent コンポーネント作成（Tiptap JSON レンダリング）
- TableOfContents コンポーネント作成（h2/h3 から自動生成）
- 関連記事表示統合
- シェアボタン実装
- OGP 設定追加

Refs: docs/implementation/01-posts-feature.md

Co-Authored-By: Agent-1 <agent-1@ohmyopencode.ai>"
```

### STEP 6: ドキュメント更新

```bash
# 実装状況ドキュメントを更新
# docs/implementation/{feature-id}-feature.md の「実装状況サマリー」を更新

git add docs/implementation/
git commit -m "docs: 記事詳細ページ実装状況を更新"
```

### STEP 7: タスク完了の共有

```bash
# active-tasks.json の該当タスクを completed に更新（前述手順）
```

---

## 🔀 Git コミットメッセージ規約

### 基本フォーマット

```
<type>: <subject>

<body>

<footer>
```

### Type（必須）

- **feat**: 新機能追加
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コードフォーマット（機能変更なし）
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: ビルド・補助ツール変更

---

## 🚨 競合発生時の対処

### ファイル編集の競合

```bash
# 1. Pull して競合を確認
git pull

# 2. 競合箇所を確認
git status

# 3. マージツールで解決
# または手動で編集

# 4. 解決後にコミット
git add .
git commit -m "fix: merge conflict resolved"
```

### 停滞タスクの再割当（タイムアウト目安）

- 最終更新から長時間進捗が無い場合、担当者に確認して `pending` に戻す
- 再割当後に `active-tasks.json` を更新して共有

```bash
git add docs/implementation/active-tasks.json
git commit -m "docs: reopen task {task-id}"
git push
```

---

## ⚙️ エージェント間の連携ルール

### 原則1: 機能単位で分担

エージェントは**機能単位**で作業を分担。

例:
- Agent-1: 記事機能（posts）
- Agent-2: 認証機能（auth）
- Agent-3: プロジェクト機能（projects）

### 原則2: 共通ファイルの編集は慎重に

以下のファイルは複数エージェントが編集する可能性があるため、**タスクの description に影響ファイルを明記**:

- `package.json`
- `src/types/database.ts`
- `src/lib/utils.ts`
- データベースマイグレーション

対策: 事前共有と小さめのコミットで衝突を回避

### 原則3: 定期的なPull

競合を最小化するため、**10分ごとに`git pull`**を実行。

```bash
# 定期的にPull
git pull

# 競合がある場合は、Lock取得前に解決
```

---

**最終更新**: 2026-02-23
