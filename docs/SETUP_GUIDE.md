# Chronos Rewards - 詳細セットアップガイド（Gemini向け）

このガイドは、AIアシスタント（Gemini）と一緒にプロジェクトをセットアップする際の詳細手順です。

---

## 🎯 セットアップの全体像

1. **Supabaseプロジェクト作成** → データベース・認証の準備
2. **Google Cloud Console設定** → OAuth認証の準備
3. **ローカル環境構築** → 開発サーバーの起動
4. **動作確認** → テストスクリプトの実行

---

## 📦 Part 0: 前提条件の確認

### 必要なソフトウェア

- ✅ Node.js v22.13.0以上
- ✅ npm v10以上
- ✅ Git

### 確認コマンド

```bash
node --version  # v22.13.0以上
npm --version   # v10以上
git --version   # 任意のバージョン
```

### プロジェクトのクローンまたは展開

```bash
# Gitからクローンする場合
git clone <repository-url>
cd chronos-rewards

# zipファイルを展開した場合
cd chronos-rewards
```

### 依存関係のインストール

```bash
npm install
```

**期待される出力:**
```
added 300+ packages in 30s
```

---

## 🗄️ Part 1: Supabaseプロジェクト作成

### 1.1 アカウント作成・ログイン

**手順:**

1. ブラウザで https://supabase.com にアクセス

2. 右上の「Sign In」をクリック
   - GitHubアカウントでログイン（推奨）
   - または「Sign Up」でメールアドレス登録

3. ログイン後、ダッシュボードが表示される

---

### 1.2 新規プロジェクト作成

**手順:**

1. ダッシュボードで「New Project」ボタンをクリック

2. プロジェクト情報を入力:
   ```
   Organization: （新規作成 or 既存選択）
   Name: chronos-rewards
   Database Password: （強力なパスワードを設定、必ずメモ！）
   Region: Northeast Asia (Tokyo)
   Pricing Plan: Free
   ```

   **重要:** Database Passwordは後で必要になるので必ずメモ！

3. 「Create new project」をクリック

4. プロジェクト作成に1-2分かかります
   - 「Setting up project...」と表示される
   - 完了すると「Project API」画面が表示される

---

### 1.3 APIキーの取得

**手順:**

1. 左サイドバーから「Settings」（歯車アイコン）をクリック

2. 「API」をクリック

3. 以下の2つの値をコピーしてメモ:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public (公開キー):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```

   **注意:** `service_role secret`は使用しません（セキュリティ上の理由）

---

### 1.4 データベースの初期化

**手順:**

1. 左サイドバーから「SQL Editor」をクリック

2. 「+ New query」をクリック

3. プロジェクトフォルダ内の`supabase-migration.sql`ファイルを開く

4. ファイルの内容を**すべて**コピー

5. Supabase SQL Editorに貼り付け

6. 右下の「Run」ボタンをクリック

**期待される出力:**
```
Success. No rows returned
```

**エラーが出た場合:**
- 「Success. No rows returned」以外のメッセージが出たら、エラー内容を確認
- よくあるエラー: 構文エラー → SQLファイル全体がコピーされているか確認

---

### 1.5 Realtimeの有効化確認

**手順:**

1. 左サイドバーから「Database」→「Replication」をクリック

2. 以下のテーブルが「Realtime enabled」になっているか確認:
   - `tasks`
   - `task_checklist`
   - `user_profiles`
   - `reward_history`

3. もし無効になっていたら、各テーブルの「Enable」をクリック

---

## 🔐 Part 2: Google OAuth設定

### 2.1 Google Cloud Consoleプロジェクト作成

**手順:**

1. https://console.cloud.google.com/ にアクセス

2. Googleアカウントでログイン

3. 左上の「プロジェクトを選択」→「新しいプロジェクト」をクリック

4. プロジェクト情報を入力:
   ```
   プロジェクト名: Chronos Rewards
   組織: なし
   ```

5. 「作成」をクリック

6. 作成されたプロジェクトを選択

---

### 2.2 OAuth同意画面の設定

**手順:**

1. 左側メニューから「APIとサービス」→「OAuth同意画面」をクリック

2. ユーザータイプを選択:
   ```
   ● 外部
   ```

3. 「作成」をクリック

4. アプリ情報を入力:
   ```
   アプリ名: Chronos Rewards
   ユーザーサポートメール: （あなたのメールアドレス）
   デベロッパーの連絡先情報: （あなたのメールアドレス）
   ```

5. 「保存して次へ」をクリック

6. スコープ画面:
   - 何も追加せず「保存して次へ」をクリック

7. テストユーザー画面:
   - あなたのメールアドレスを追加
   - 「保存して次へ」をクリック

8. 「ダッシュボードに戻る」をクリック

---

### 2.3 OAuth認証情報の作成

**手順:**

1. 左側メニューから「APIとサービス」→「認証情報」をクリック

2. 上部の「+ 認証情報を作成」→「OAuthクライアントID」をクリック

3. アプリケーションの種類:
   ```
   ● ウェブアプリケーション
   ```

4. 名前:
   ```
   Chronos Rewards Web Client
   ```

5. 承認済みのJavaScript生成元:
   ```
   http://localhost:3000
   ```

6. 承認済みのリダイレクトURI:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```

   **重要:** `xxxxxxxxxxxxx`の部分は、Part 1.3で取得したProject URLの値に置き換える

   例:
   ```
   https://abcdefghijklmn.supabase.co/auth/v1/callback
   ```

7. 「作成」をクリック

8. 表示されるダイアログから以下をコピーしてメモ:
   ```
   クライアントID: 123456789-abc...apps.googleusercontent.com
   クライアントシークレット: GOCSPX-...
   ```

---

### 2.4 SupabaseにGoogle OAuth情報を設定

**手順:**

1. Supabaseダッシュボードに戻る

2. 左サイドバーから「Authentication」→「Providers」をクリック

3. 「Google」の行の「Enabled」トグルをONにする

4. Google認証情報を入力:
   ```
   Client ID: （Part 2.3で取得したクライアントID）
   Client Secret: （Part 2.3で取得したクライアントシークレット）
   ```

5. 「Save」をクリック

---

## 💻 Part 3: ローカル環境構築

### 3.1 環境変数ファイルの作成

**手順:**

1. プロジェクトフォルダで`.env.local`ファイルを作成

   **Windows (コマンドプロンプト):**
   ```cmd
   copy .env.example .env.local
   ```

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env.local
   ```

   **Mac/Linux:**
   ```bash
   cp .env.example .env.local
   ```

2. `.env.local`をテキストエディタ（VSCode、サクラエディタ等）で開く

3. 以下のように編集:

   ```env
   # Supabase設定
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

   **重要:** 
   - `xxxxxxxxxxxxx`はPart 1.3で取得したProject URLに置き換え
   - `eyJhbGci...`はPart 1.3で取得したanon public keyに置き換え

4. 保存して閉じる

---

### 3.2 テストスクリプトの実行

**動作確認のため、テストスクリプトを実行します。**

#### テスト1: 認証テスト

```bash
npm run test:auth
```

**期待される出力:**
```
✅ Supabase接続成功
✅ データベース接続成功
✅ 全テーブル存在確認完了
✅ RLS設定正常
✅ 環境変数確認完了

==================================================
  認証テスト - テスト結果
==================================================
✅ 成功: 5
❌ 失敗: 0
==================================================
```

**エラーが出た場合:**
- 「環境変数が設定されていません」→ `.env.local`の設定を確認
- 「テーブルが見つかりません」→ `supabase-migration.sql`の実行を確認

#### テスト2: 報酬計算テスト

```bash
npm run test:rewards
```

**期待される出力:**
```
✅ 詳細度計算テスト成功
✅ コイン報酬計算テスト成功
✅ クリスタル報酬計算テスト成功
✅ スタミナ計算テスト成功
...
==================================================
  報酬計算テスト - テスト結果
==================================================
✅ 成功: 8
❌ 失敗: 0
==================================================
```

---

### 3.3 開発サーバーの起動

**手順:**

1. 開発サーバーを起動:

   ```bash
   npm run dev
   ```

2. ブラウザで以下にアクセス:
   ```
   http://localhost:3000
   ```

**期待される画面:**
- ログインボタンが表示される
- 「Chronos Rewards」のタイトルが表示される

---

## 🎮 Part 4: 動作確認

### 4.1 ログインテスト

**手順:**

1. ブラウザで http://localhost:3000 にアクセス

2. 「Googleでログイン」ボタンをクリック

3. Google OAuth画面が表示される
   - テストユーザー（Part 2.2で追加したアカウント）でログイン

4. 認証成功後、ダッシュボード画面にリダイレクトされる

**期待される画面:**
- ユーザー名（またはメールアドレス）が表示される
- コイン: 0
- クリスタル: 0
- スタミナ: 100/100

---

### 4.2 タスク作成テスト（手動）

**手順:**

1. 右下の「＋ 短期」ボタンをクリック

2. タスク作成フォームが表示される（現時点では仮実装）

3. 以下を入力:
   ```
   タイトル: テストタスク
   期限: （明日の日付）
   重さ: 1時間
   ```

4. 「作成」ボタンをクリック

**期待される動作:**
- タスクが作成される
- コインが10増える
- スタミナが10減る

---

### 4.3 データベース確認（Supabase Dashboard）

**手順:**

1. Supabaseダッシュボードを開く

2. 左サイドバーから「Table Editor」をクリック

3. 「tasks」テーブルを選択

4. 作成したタスクが表示されることを確認

---

## ✅ セットアップ完了チェックリスト

以下がすべて✅になっていれば、セットアップ完了です！

- [ ] Node.js v22.13.0以上がインストール済み
- [ ] `npm install`が成功
- [ ] Supabaseプロジェクトが作成済み
- [ ] データベースが初期化済み（`supabase-migration.sql`実行）
- [ ] Google Cloud Consoleプロジェクトが作成済み
- [ ] OAuth同意画面が設定済み
- [ ] OAuth認証情報が作成済み
- [ ] SupabaseにGoogle OAuth情報が設定済み
- [ ] `.env.local`ファイルが正しく設定済み
- [ ] `npm run test:auth`が成功（5/5）
- [ ] `npm run test:rewards`が成功（8/8）
- [ ] `npm run dev`で開発サーバーが起動
- [ ] ブラウザで http://localhost:3000 にアクセス可能
- [ ] Googleログインが成功

---

## 🐛 トラブルシューティング

### エラー: `Cannot find module 'next'`

**原因:** 依存関係がインストールされていない

**解決策:**
```bash
npm install
```

---

### エラー: `NEXT_PUBLIC_SUPABASE_URL is not defined`

**原因:** `.env.local`が設定されていない、または読み込まれていない

**解決策:**
1. `.env.local`ファイルが存在するか確認
2. ファイル内容が正しいか確認
3. 開発サーバーを再起動

```bash
# Ctrl+C で停止
npm run dev
```

---

### エラー: `relation "tasks" does not exist`

**原因:** データベース初期化が完了していない

**解決策:**
1. Supabase Dashboard > SQL Editor
2. `supabase-migration.sql`の内容を再度実行
3. 「Run」をクリック

---

### エラー: `Invalid login credentials`

**原因:** Google OAuth設定が間違っている

**解決策:**
1. Supabase Dashboard > Authentication > Providers
2. Google設定を確認
3. Client IDとClient Secretが正しいか確認
4. リダイレクトURIが正しいか確認

---

### Google OAuth画面で「このアプリは確認されていません」

**原因:** OAuth同意画面が「テスト」モードになっている（正常）

**解決策:**
1. 「詳細」をクリック
2. 「Chronos Rewards（安全ではないページ）に移動」をクリック
3. テストユーザーでログイン

---

## 📚 次のステップ

セットアップが完了したら:

1. **テストスクリプトの実行** - `docs/TEST_GUIDE.md`を参照
2. **コンポーネント設計の確認** - `docs/COMPONENT_DESIGN.md`を参照
3. **API設計の確認** - `docs/API_DESIGN.md`を参照
4. **UI実装の開始** - 明日以降

---

## 🔗 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [プロジェクトREADME](../README.md)

---

## 💬 サポート

問題が解決しない場合は、以下の情報を添えて質問してください:

1. エラーメッセージの全文
2. 実行したコマンド
3. Node.jsのバージョン（`node --version`）
4. どの手順で問題が発生したか
