# Chronos Rewards - タスク管理アプリ

ゲーミフィケーション要素を持つ時限別タスク管理アプリ

## 📋 プロジェクト概要

短期（今日）から超長期（3年）までのタスクを「時限別」に管理し、立案と消化で異なる報酬（コイン/クリスタル）を得るゲーミフィケーション・タスク管理アプリ。PCとスマホ（Android PWA）でリアルタイム同期する。

## 🚀 開発環境のセットアップ

### 必要な環境

- **Node.js**: v22.13.0以上
- **npm**: v10以上
- **Supabase アカウント**: [https://supabase.com](https://supabase.com)
- **Vercel アカウント** (デプロイ時): [https://vercel.com](https://vercel.com)

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトのセットアップ

#### 2.1. Supabaseプロジェクトを作成

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. "New Project"をクリック
3. プロジェクト名、データベースパスワードを設定

#### 2.2. データベースマイグレーション実行

1. Supabase Dashboard > SQL Editorを開く
2. `supabase-migration.sql`の内容を全てコピー＆ペースト
3. "Run"をクリックして実行

#### 2.3. Google OAuth設定

1. Supabase Dashboard > Authentication > Providersを開く
2. Googleを有効化
3. Google Cloud Consoleでクライアント ID/シークレットを取得
4. Supabaseに設定

詳細: [Supabase Google OAuth ガイド](https://supabase.com/docs/guides/auth/social-login/auth-google)

### 3. 環境変数の設定

`.env.example`を`.env.local`にコピーして編集：

```bash
cp .env.example .env.local
```

`.env.local`を編集：

```env
# Supabase Dashboard > Settings > API から取得
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📂 プロジェクト構造

```
chronos-rewards/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # ダッシュボード
├── components/             # Reactコンポーネント（今後追加）
│   ├── ui/                 # 基本UIコンポーネント
│   ├── tasks/              # タスク関連コンポーネント
│   └── rewards/            # 報酬関連コンポーネント
├── lib/                    # ライブラリ・ユーティリティ
│   ├── config/             # 設定ファイル
│   │   └── game-balance.ts # ゲームバランス設定
│   ├── supabase/           # Supabaseクライアント
│   │   ├── client.ts       # クライアントサイド
│   │   └── server.ts       # サーバーサイド
│   ├── stores/             # Zustand状態管理
│   │   ├── user-store.ts   # ユーザーストア
│   │   ├── task-store.ts   # タスクストア
│   │   └── genre-store.ts  # ジャンルストア
│   └── utils/              # ユーティリティ関数
│       ├── date-utils.ts   # 日付処理
│       └── reward-utils.ts # 報酬計算
├── types/                  # TypeScript型定義
│   └── database.ts         # データベース型定義
├── styles/                 # スタイルシート
│   └── globals.css         # グローバルCSS
├── public/                 # 静的ファイル（今後追加）
└── supabase-migration.sql  # データベース初期化SQL
```

## 🎮 ゲームバランス設定

`lib/config/game-balance.ts` で報酬・スタミナの数値を調整可能：

- **コイン報酬**: タスク作成時の基本コイン、詳細度倍率など
- **クリスタル報酬**: 完了時のクリスタル、親タスクボーナスなど
- **スタミナ**: 最大値、回復速度、消費量など

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
```

## 📖 ドキュメント

プロジェクトの詳細設計は以下のドキュメントを参照：

- **要件定義書**: `chronos-rewards-requirements.md`
- **データベース設計書**: `chronos-rewards-database-design.md`
- **アーキテクチャ図**: `chronos-rewards-architecture-diagrams.md`

## 🔒 セキュリティ

- **Row Level Security (RLS)**: Supabaseで有効化済み
- **環境変数**: `.env.local`はGitにコミットしない
- **認証**: Supabase Auth（Google OAuth）を使用

## 🚢 デプロイ

### Vercelへのデプロイ

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)でプロジェクトをインポート
3. 環境変数を設定（Vercel Dashboard > Settings > Environment Variables）
4. デプロイ実行

## 📝 今後の実装予定

- [ ] UIコンポーネントの実装
- [ ] タスク作成・編集フォーム
- [ ] スワイプ操作
- [ ] アニメーション
- [ ] PWA設定
- [ ] オフライン対応
- [ ] 統計画面

## 🤝 貢献

プロジェクトへの貢献を歓迎します。

## 📄 ライセンス

Private Project

## 👤 作者

@unibell4
