# オーナー対応タスク（Auth 優先）

このファイルは、**オーナーのみが対応できる作業**を追跡します。
Auth 周辺の状況が変わったら更新してください。

## 1. Supabase Auth 設定

- Supabase プロジェクトで Email 認証を有効化
- Email 認証モードの決定
  - パスワード + メール確認
  - またはマジックリンク（パスワードレス）
- メールテンプレートの設定（signup / magic link / reset）
- 開発/本番のリダイレクト URL を確認

## 2. Google OAuth 設定

- Google OAuth クライアント（Web）を作成
- Supabase のコールバック URL を登録
  - https://<your-supabase-project>.supabase.co/auth/v1/callback
- 許可済み JavaScript オリジン
  - http://localhost:3000
  - https://<your-prod-domain>
- Supabase Auth Provider に Client ID / Secret を設定

## 3. 環境変数

- 以下の値を用意
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY（サーバーのみで使う場合）
- Vercel の環境変数がローカルと一致していることを確認

## 4. ドメインとリダイレクト方針

- 本番ドメイン（Vercel / カスタムドメイン）を確定
- アプリ側のコールバックルートを確認
  - /auth/callback
  - /login, /signup
- 全環境のリダイレクト URL 一覧を共有

## 5. セキュリティ方針

- メール確認を必須にするか
- セッション有効期限とリフレッシュ方針
