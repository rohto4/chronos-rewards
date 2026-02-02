# Chronos Rewards - タスク管理アプリ

ゲーミフィケーション要素を持つ時限別タスク管理アプリ

## 📋 プロジェクト概要

短期（今日）から超長期（3年）までのタスクを「時限別」に管理し、立案と消化で異なる報酬（コイン/クリスタル）を得るゲーミフィケーション・タスク管理アプリ。PCとスマホ（Android PWA）でリアルタイム同期する。

## ✨ 主な機能

### 🎯 タスク管理
- **時限別フィルタリング**: 今日、今週、1ヶ月、1年、3年などの期間でフィルタ
- **ジャンル分類**: カラフルなジャンルタグで視覚的に整理
- **チェックリスト**: タスクの前提条件を管理
- **親子タスク**: 大きなタスクを小さなタスクに分解
- **期限管理**: 期限切れ・期限間近を色分け表示

### 🎮 ゲーミフィケーション
- **コイン**: タスク作成時の報酬（詳細度に応じて変動）
- **クリスタル**: タスク完了時の報酬（見積時間に応じて変動）
- **スタミナ**: タスク実行に必要なエネルギー（時間で自動回復）
- **レベルシステム**: 経験値を獲得してレベルアップ
- **派手なアニメーション**: 報酬獲得・レベルアップ時の演出

### 📱 モダンUI/UX
- **レスポンシブデザイン**: PC・タブレット・スマホ対応
- **PWA対応**: アプリのようにインストール可能
- **スワイプ操作**: タスクカードをスワイプで削除
- **リアルタイム同期**: Supabase Realtimeで複数デバイス同期
- **オフライン対応**: ネットワーク断絶時も動作

## 🚀 開発環境のセットアップ

### 必要な環境

- **Node.js**: v22.13.0以上
- **npm**: v10以上
- **Supabase アカウント**: [https://supabase.com](https://supabase.com)
- **Vercel アカウント** (デプロイ時): [https://vercel.com](https://vercel.com)

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd chronos-rewards
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseプロジェクトのセットアップ

#### 3.1. Supabaseプロジェクトを作成

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. "New Project"をクリック
3. プロジェクト名、データベースパスワードを設定

#### 3.2. データベースマイグレーション実行

1. Supabase Dashboard > SQL Editorを開く
2. `supabase-migration.sql`の内容を全てコピー＆ペースト
3. "Run"をクリックして実行

これにより以下が作成されます：
- テーブル（user_profiles, tasks, task_genres, task_checklist, reward_history, stamina_history）
- ビュー（v_task_tree, v_task_statistics）
- 関数（報酬計算、スタミナ管理など）
- トリガー（自動計算、整合性チェックなど）
- Row Level Security (RLS) ポリシー

#### 3.3. Google OAuth設定（オプション）

1. Supabase Dashboard > Authentication > Providersを開く
2. Googleを有効化
3. Google Cloud Consoleでクライアント ID/シークレットを取得
4. Supabaseに設定

詳細: [Supabase Google OAuth ガイド](https://supabase.com/docs/guides/auth/social-login/auth-google)

### 4. 環境変数の設定

`.env.local`ファイルを作成：

```env
# Supabase Dashboard > Settings > API から取得
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📂 プロジェクト構造

```
chronos-rewards/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # メインページ（リダイレクト）
│   ├── dashboard/
│   │   └── page.tsx              # ダッシュボード（メイン画面）
│   └── login/
│       └── page.tsx              # ログインページ
│
├── components/                   # Reactコンポーネント
│   ├── animations/               # Phase 5: アニメーション
│   │   ├── RewardAnimation.tsx
│   │   ├── LevelUpAnimation.tsx
│   │   └── StaminaRecoveryEffect.tsx
│   ├── layout/                   # レイアウトコンポーネント
│   │   ├── Header.tsx            # ヘッダー（報酬・スタミナ表示）
│   │   ├── FilterChips.tsx       # フィルタUI
│   │   └── QuickAddButtons.tsx   # FAB（クイック登録）
│   ├── providers/                # プロバイダー
│   │   └── AuthProvider.tsx      # 認証プロバイダー
│   ├── tasks/                    # タスク関連
│   │   ├── TaskCard.tsx          # タスクカード
│   │   ├── TaskList.tsx          # タスク一覧
│   │   ├── TaskForm.tsx          # タスクフォーム
│   │   ├── ChecklistEditor.tsx   # チェックリスト編集
│   │   ├── GenreSelector.tsx     # ジャンル選択
│   │   └── DeadlinePicker.tsx    # 期限選択
│   └── ui/                       # 基本UIコンポーネント
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Textarea.tsx
│       ├── Badge.tsx
│       ├── Progress.tsx
│       ├── Modal.tsx
│       ├── toast.tsx
│       ├── CoinDisplay.tsx       # コイン表示
│       ├── CrystalDisplay.tsx    # クリスタル表示
│       └── StaminaBar.tsx        # スタミナバー
│
├── lib/                          # ライブラリ・ユーティリティ
│   ├── config/
│   │   ├── game-balance.ts       # ゲームバランス設定
│   │   └── game-config.ts        # ゲーム設定
│   ├── supabase/                 # Supabaseクライアント
│   │   ├── client.ts             # クライアントサイド
│   │   └── server.ts             # サーバーサイド
│   ├── stores/                   # Zustand状態管理
│   │   ├── user-store.ts         # ユーザーストア
│   │   ├── task-store.ts         # タスクストア
│   │   ├── genre-store.ts        # ジャンルストア
│   │   └── toast-store.ts        # トーストストア
│   └── utils/                    # ユーティリティ関数
│       ├── date-utils.ts         # 日付処理
│       ├── reward-utils.ts       # 報酬計算
│       └── utils.ts              # 汎用ユーティリティ
│
├── types/                        # TypeScript型定義
│   └── database.ts               # データベース型定義
│
├── styles/
│   └── globals.css               # グローバルCSS
│
├── public/                       # 静的ファイル
│
└── scripts/                      # テストスクリプト
    ├── test-auth.ts              # 認証テスト
    ├── test-tasks.ts             # タスクCRUDテスト
    ├── test-rewards.ts           # 報酬計算テスト
    └── test-genres.ts            # ジャンル管理テスト
```

## 🧪 テスト

### バックエンドテスト（既存）

データベースとAPIの動作確認：

```bash
# 認証テスト
npm run test:auth

# タスクCRUDテスト
npm run test:tasks

# 報酬計算テスト
npm run test:rewards

# ジャンル管理テスト
npm run test:genres

# 全テスト実行
npm run test:all
```

### フロントエンドテスト（Phase 1-5用）

コンポーネントの動作確認：

```bash
# UIコンポーネントテスト
npm run test:ui

# タスク機能テスト
npm run test:task-components

# アニメーションテスト
npm run test:animations

# 全コンポーネントテスト実行
npm run test:components
```

## 🎮 ゲームバランス設定

`lib/config/game-balance.ts` で報酬・スタミナの数値を調整可能：

### コイン報酬
- **基本コイン**: タスク作成時の基本報酬
- **詳細度倍率**: レベル1～5で報酬が変動
- **チェックリストボーナス**: 前提条件設定で追加報酬
- **ベネフィットボーナス**: 得られるもの記述で追加報酬

### クリスタル報酬
- **基本クリスタル**: 見積時間あたりの報酬
- **親タスクボーナス**: 親タスク完了で大量ボーナス
- **チェックリストボーナス**: 前提条件達成で追加報酬

### スタミナ
- **最大値**: 初期最大スタミナ
- **回復速度**: 1分あたりの回復量
- **消費量**: アクション別の消費スタミナ

設定を変更後、アプリを再起動すると反映されます。

## 🛠️ 開発用スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# 型チェック
npm run type-check

# Lint実行
npm run lint

# テスト実行
npm run test:all          # バックエンドテスト
npm run test:components   # フロントエンドテスト
```

## 📖 ドキュメント

プロジェクトの詳細設計は以下のドキュメントを参照：

- **要件定義書**: `requirements.md`
- **データベース設計書**: `database-design.md`
- **アーキテクチャ図**: `architecture-diagrams.md`
- **API設計書**: `API_DESIGN.md`
- **コンポーネント設計書**: `COMPONENT_DESIGN.md`
- **セットアップガイド**: `SETUP_GUIDE.md`
- **テストガイド**: `TEST_GUIDE.md`
- **技術リファレンス**: `REFERENCES.md`

## 🎨 実装済みコンポーネント

### Phase 1: 基本UI（8コンポーネント）
✅ Button - ボタン（variant, size, loading対応）  
✅ Card - カード（Header, Body, Footer）  
✅ Input - 入力フィールド（エラー表示、アイコン対応）  
✅ Textarea - テキストエリア（文字数カウント）  
✅ Badge - バッジ（ステータス表示）  
✅ Progress - プログレスバー  
✅ Modal - モーダルダイアログ  
✅ Toast - トースト通知  

### Phase 2: 認証・レイアウト（4コンポーネント）
✅ AuthProvider - 認証状態管理  
✅ Header - ヘッダー（報酬・スタミナ表示）  
✅ LoginPage - ログインページ  
✅ DashboardPage - ダッシュボード完成版  

### Phase 3: タスク機能（6コンポーネント）
✅ TaskCard - タスクカード（期限色分け、進捗表示）  
✅ TaskList - タスク一覧（期限別グループ化）  
✅ TaskForm - タスク作成/編集フォーム  
✅ ChecklistEditor - チェックリスト編集  
✅ GenreSelector - ジャンル選択・新規作成  
✅ DeadlinePicker - 期限選択UI  

### Phase 4: 報酬・フィルタ（5コンポーネント）
✅ CoinDisplay - コイン表示（カウントアップ）  
✅ CrystalDisplay - クリスタル表示（キラキラエフェクト）  
✅ StaminaBar - スタミナバー（回復時間表示）  
✅ FilterChips - フィルタチップ（期間・ジャンル）  
✅ QuickAddButtons - FAB（展開式メニュー）  

### Phase 5: アニメーション（3コンポーネント）
✅ RewardAnimation - 報酬獲得演出  
✅ LevelUpAnimation - レベルアップ演出  
✅ StaminaRecoveryEffect - スタミナ回復通知  

**合計: 26コンポーネント**

## 🔒 セキュリティ

- **Row Level Security (RLS)**: Supabaseで全テーブルに適用済み
- **環境変数**: `.env.local`はGitにコミットしない（`.gitignore`に追加済み）
- **認証**: Supabase Auth（メール/パスワード + Google OAuth）
- **型安全性**: TypeScriptで完全な型定義

## 🚢 デプロイ

### Vercelへのデプロイ

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)でプロジェクトをインポート
3. 環境変数を設定（Vercel Dashboard > Settings > Environment Variables）
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイ実行

### PWA設定

`next.config.js`でPWA設定済み。以下の機能が有効：
- オフラインキャッシュ
- アプリインストール対応
- プッシュ通知対応（今後実装予定）

## 📝 今後の実装予定

- [ ] タスク詳細モーダル
- [ ] 統計・分析画面
- [ ] カレンダービュー
- [ ] レベル・実績システム
- [ ] エクスポート機能（CSV/JSON）
- [ ] ダークモード
- [ ] 多言語対応
- [ ] プッシュ通知

## 🐛 既知の問題

現在、既知の問題はありません。

## 🤝 貢献

プロジェクトへの貢献を歓迎します。

## 📄 ライセンス

Private Project

## 👤 作者

@unibell4

## 🙏 謝辞

このプロジェクトは以下のオープンソースライブラリを使用しています：
- Next.js
- React
- Supabase
- Tailwind CSS
- Framer Motion
- Zustand
- date-fns
- Lucide React
