# カバレッジ達成時の既知の問題

## 現在のブロッカー

### 1. カバレッジ生成エラー
**症状:** `ENOENT: no such file or directory, open 'coverage/.tmp/coverage-1.json'`
**原因:** v8プロバイダーの一時ファイル生成問題
**解決策:**
```bash
rm -rf coverage node_modules/.vitest
npm install
npm run test:coverage
```

### 2. Next.js Server Components非対応
**症状:** async Server Componentsがテスト不可
**影響:** `app/dashboard/page.tsx`など
**回避策:** 
- 同期的なロジックのみ単体テスト
- E2Eテスト（Playwright）で補完
- カバレッジ除外に追加

### 3. Supabase Realtime機能
**症状:** リアルタイム同期のテストが困難
**影響:** タスク同期機能
**回避策:**
- モックで基本動作確認
- 統合テスト環境でE2E検証

## 潜在的な問題

### A. 動的import
- Next.jsの動的コンポーネント読み込み
- `coverage.all: true`で対応

### B. 環境変数依存
- Supabase URL/KEYなど
- テスト用の.env.test作成

### C. ブラウザAPI依存
- localStorage, sessionStorage
- jsdomで自動モック

## 解決済み

- ✅ Framer Motionモック（vitest.setup.ts）
- ✅ next/navigationモック（vitest.setup.ts）
- ✅ React Testing Libraryセットアップ

## 2026-02-23（テスト追加による分岐補完）
- **対象分岐:** TaskCard の actions/genre/description 切り替えと ChecklistEditor の追加/Enter/非 Enter/削除の各ガード。
- **テスト:** `npm run test:run` & `npm run test:coverage` で確認済み。
- **残ブロッカー:** なし

## 2026-02-23（Input/Textarea 分岐検証）
- **対象分岐:** Input の helper vs error、icon padding、disabled/readOnly、Textarea の helper + counter vs error、showCount/maxLength の依存。
- **検証:** `npm run test:run` `npm run test:coverage` で両コンポーネントの branch coverage を再測定。
- **残ブロッカー:** なし

## 2026-02-23（COVERAGE-001: Textarea 必須インジケータ）
- line 62 の `props.required` 分岐（必須アスタリスク表示）を `within(label).getByText('*')` で通した
- coverage: `components/ui/Textarea.tsx` の statements/branches/functions/lines はすべて 100%、branch 100% のレポート確認済み
- 残ブロッカー: なし

## 2026-02-23（COVERAGE-001: キーボード/アイコン/ドット分岐）
- **対象分岐:** TaskCard line 118 の Enter/Space で onClick がある/ない場合、Button line 123 の rightIcon 描画、Badge lines 75/80 の primary/purple ドット色。
- **検証:** `npm run test:run` `npm run test:coverage` で coverage を再測定し、branches 100% を確認。
- **最終カバレッジ:** All files statements 99.52%, branches 100%, functions 98.36%, lines 99.5%.
- **警告:** `vitest` 実行中に `Received \'layout\' for a non-boolean attribute`（framer-motion の `layout` prop）が引き続き出力されるが、テストは成功し、テスト対象に副作用なし。
- **残ブロッカー:** なし。

## 2026-02-23（COVERAGE-001: Card コンポーネント検証）
- **対象:** `components/ui/Card.tsx` の default/outline/ghost variant branch と各サブコンポーネントの className マージ。
- **検証:** `components/ui/Card.test.tsx` で `data-testid` を渡してレンダリングし、`getByText`/`getByTestId` で各要素の text/class を確認し、CardDescription `text-sm` branch も通過。
- **最終カバレッジ:** All files statements/branches/functions/lines 100%、`components/ui/Card.tsx` も statements/functions/lines 100%、branch 100%。
- **残ブロッカー:** なし。
