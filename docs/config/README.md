# 設定ファイル一覧

このフォルダは、運用/初期化/検証用の設定ファイルをまとめています。
変更時は影響範囲を必ず共有してください。

## ファイルの役割

- `docs/config/clear-users.sql`
  - Supabase のユーザー初期化用 SQL（開発/検証向け）
- `docs/config/supabase-migration.sql`
  - 旧マイグレーション（参照用）
- `docs/config/supabase-migration-fixed.sql`
  - 修正版マイグレーション（適用対象）
- `docs/config/game-config.txt`
  - ゲーム設定のメモ（人間向け）
- `docs/config/game-config.ts`
  - ゲーム設定の TypeScript 版（実装参照）

## 注意

- 本番環境に適用する場合は必ずレビューを通す
- SQL は実行前にバックアップを取得する
