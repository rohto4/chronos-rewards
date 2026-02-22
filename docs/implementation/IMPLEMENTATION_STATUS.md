# Chronos Rewards - 実装状況・ロードマップ

最終更新日: 2026年2月22日

---

## 📊 プロジェクト現状

- **全体進捗**: 100%（Phase 1-9 実装済み、品質改善タスクは継続）
- **実装済みモジュール**: 70ファイル / 12,075行（.ts/.tsx/.js/.css 合計）
- **未実装モジュール**: 0ファイル
- **テストスクリプト**: 8ファイル / 1,756行

---

## ⚠️ 既知の問題 / 未解決

1. **Supabase Auth Helpers 型推論問題**
   - **影響範囲**: `lib/stores/*.ts` (genre-store, task-store, user-store), `components/providers/AuthProvider.tsx`
   - **症状**: テーブル型が `never` と推論され、insert/update でTypeScriptエラー
   - **暫定対応**: 該当ファイルに `// @ts-nocheck` を追加
   - **根本原因**: `@supabase/auth-helpers-nextjs` v0.9.0 の型推論バグ
   - **恒久対策**:
     - Supabase パッケージのアップグレード
     - または `@supabase/ssr` への移行を検討
   - **実行時影響**: なし（型定義の問題のみ）

2. **Next.js メタデータ警告**
   - **症状**: `themeColor` と `viewport` をmetadataからviewportに移行する警告
   - **影響**: ビルド時の警告のみ、機能には影響なし
   - **対応**: NEXT-001で対応予定

---

## 🔭 現在の作業

- 進行中/予定のタスクは `docs/implementation/implementation-plan.md` と `.locks/tasks/active-tasks.json` を参照
- 仕様・設計の詳細は `docs/requirements.md` と `docs/architecture.md` を参照

---

## 🧾 更新方針

- 実装が完了し、仕様・設計書に反映済みの内容は本ファイルから削除する
- 本ファイルは「未解決事項・現在の作業」のみを簡潔に保持する
