# フロントエンドコンポーネントテストガイド

Phase 1～5で実装したコンポーネントのテスト方法

## 📋 前提条件

以下のパッケージがインストール済みであることを確認してください：

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

## 🛠️ Vitestの設定

`vitest.config.ts`を作成：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test-setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

## 🔧 セットアップファイル

`test-setup.ts`を作成：

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
```

## 📝 package.jsonにスクリプト追加

```json
{
  "scripts": {
    "test:ui": "vitest scripts/test-ui-components.ts",
    "test:task-components": "vitest scripts/test-task-components.ts",
    "test:animations": "vitest scripts/test-animations.ts",
    "test:components": "vitest scripts/test-ui-components.ts scripts/test-task-components.ts scripts/test-animations.ts",
    "test:components:watch": "vitest scripts/test-ui-components.ts scripts/test-task-components.ts scripts/test-animations.ts --watch"
  }
}
```

## 🧪 テストの実行

### 個別実行

```bash
# UIコンポーネントのみ
npm run test:ui

# タスクコンポーネントのみ
npm run test:task-components

# アニメーションコンポーネントのみ
npm run test:animations
```

### 全体実行

```bash
# 全コンポーネントテスト（1回）
npm run test:components

# 全コンポーネントテスト（ウォッチモード）
npm run test:components:watch
```

## 📊 テスト対象コンポーネント

### Phase 1: UIコンポーネント（8個）
- ✅ Button - ボタン
- ✅ Card - カード
- ✅ Input - 入力フィールド
- ✅ Textarea - テキストエリア
- ✅ Badge - バッジ
- ✅ Progress - プログレスバー
- ⚠️ Modal - モーダル（手動テスト推奨）
- ⚠️ Toast - トースト通知（手動テスト推奨）

### Phase 3: タスクコンポーネント（6個）
- ✅ TaskCard - タスクカード
- ✅ ChecklistEditor - チェックリスト編集
- ⚠️ TaskList - タスク一覧（統合テスト推奨）
- ⚠️ TaskForm - タスクフォーム（統合テスト推奨）
- ⚠️ GenreSelector - ジャンル選択（統合テスト推奨）
- ⚠️ DeadlinePicker - 期限選択（統合テスト推奨）

### Phase 5: アニメーション（3個）
- ✅ RewardAnimation - 報酬獲得演出
- ✅ LevelUpAnimation - レベルアップ演出
- ✅ StaminaRecoveryEffect - スタミナ回復通知

## 📌 テスト範囲について

### 自動テスト対象
基本的なロジックとレンダリングのテスト：
- コンポーネントが正しくレンダリングされる
- プロパティが正しく適用される
- イベントハンドラが動作する
- 状態変化が反映される

### 手動テスト推奨
以下は手動テストが推奨されます：
- **Modal**: ポータル・フォーカストラップ・ESCキー
- **Toast**: 自動消滅タイミング・複数表示
- **TaskForm**: Zustand統合・Supabase連携
- **GenreSelector**: カラーピッカー・リアルタイム作成
- **DeadlinePicker**: 日付選択UI・カレンダー操作

### 統合テスト推奨
Supabase・Zustandと連携するコンポーネント：
- TaskList
- TaskForm
- GenreSelector
- DeadlinePicker

## 🎯 テストのベストプラクティス

### 1. テストは独立させる
```typescript
// Good
it('ボタンがクリックできる', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>クリック</Button>);
  fireEvent.click(screen.getByText('クリック'));
  expect(onClick).toHaveBeenCalled();
});

// Bad（外部状態に依存）
let clicked = false;
it('ボタンがクリックできる', () => {
  // ...
});
```

### 2. ユーザーの視点でテストする
```typescript
// Good（ユーザーが見るテキストで検索）
expect(screen.getByText('保存')).toBeInTheDocument();

// Bad（実装詳細に依存）
expect(container.querySelector('.save-button')).toBeInTheDocument();
```

### 3. 非同期処理は適切に待つ
```typescript
// Good
await waitFor(() => {
  expect(onComplete).toHaveBeenCalled();
});

// Bad（レースコンディション）
expect(onComplete).toHaveBeenCalled();
```

## 🐛 トラブルシューティング

### エラー: "Cannot find module '@/components/...'"

パスエイリアスが設定されていません。`vitest.config.ts`を確認してください。

### エラー: "ReferenceError: document is not defined"

JSDOMが設定されていません。`vitest.config.ts`で`environment: 'jsdom'`を設定してください。

### エラー: "toBeInTheDocument is not a function"

jest-domがセットアップされていません。`test-setup.ts`で`import '@testing-library/jest-dom'`を追加してください。

## 📖 参考リンク

- **Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **jest-dom**: https://github.com/testing-library/jest-dom
- **Testing Playground**: https://testing-playground.com/

## 🎓 テスト作成のヒント

1. **小さく始める**: 最初は簡単なレンダリングテストから
2. **一つずつテスト**: 一つのテストで一つの機能のみ検証
3. **エラーケースもテスト**: 正常系だけでなく異常系も
4. **カバレッジは目安**: 100%を目指すより重要な部分を確実に
5. **手動テストも活用**: 全てを自動化する必要はない
