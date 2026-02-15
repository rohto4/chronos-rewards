# Chronos Rewards - ダークモード一括変換ガイド

全コンポーネントをダークモード対応にするための変換表とスクリプト

## 📝 一括置換テーブル

以下の検索・置換をVSCodeの「フォルダー内を置換」機能で実行してください。

### 背景色

| 検索（ライト） | 置換（ダーク） | 用途 |
|--------------|--------------|------|
| `bg-white` | `bg-slate-900` | カード背景 |
| `bg-gray-50` | `bg-slate-950` | ページ背景 |
| `bg-gray-100` | `bg-slate-800` | セカンダリ背景 |
| `bg-gray-200` | `bg-slate-700` | ホバー背景 |
| `bg-blue-50` | `bg-blue-950` | プライマリ淡色背景 |
| `bg-green-50` | `bg-green-950` | 成功淡色背景 |
| `bg-red-50` | `bg-red-950` | エラー淡色背景 |
| `bg-yellow-50` | `bg-yellow-950` | 警告淡色背景 |

### テキスト色

| 検索（ライト） | 置換（ダーク） | 用途 |
|--------------|--------------|------|
| `text-gray-900` | `text-slate-50` | メインテキスト |
| `text-gray-800` | `text-slate-100` | 強調テキスト |
| `text-gray-700` | `text-slate-200` | 通常テキスト |
| `text-gray-600` | `text-slate-300` | サブテキスト |
| `text-gray-500` | `text-slate-400` | 補助テキスト |
| `text-gray-400` | `text-slate-500` | プレースホルダー |

### ボーダー色

| 検索（ライト） | 置換（ダーク） | 用途 |
|--------------|--------------|------|
| `border-gray-200` | `border-slate-800` | デフォルトボーダー |
| `border-gray-300` | `border-slate-700` | 強調ボーダー |
| `border-gray-400` | `border-slate-600` | アクティブボーダー |

### ホバー状態

| 検索（ライト） | 置換（ダーク） | 用途 |
|--------------|--------------|------|
| `hover:bg-gray-100` | `hover:bg-slate-800` | ホバー背景 |
| `hover:bg-gray-200` | `hover:bg-slate-700` | ホバー強調背景 |
| `hover:text-gray-900` | `hover:text-slate-50` | ホバーテキスト |

---

## 🔧 VSCodeでの一括置換手順

### 1. フォルダー内を置換を開く

- `Ctrl + Shift + H`（Windows/Linux）
- `Cmd + Shift + H`（Mac）

### 2. 検索対象を指定

**含めるファイル:**
```
components/**/*.tsx, app/**/*.tsx
```

**除外するファイル:**
```
**/node_modules/**, **/.next/**, **/dist/**
```

### 3. 正規表現モードを有効化

- 正規表現ボタン（`.*`）をクリック

### 4. 一括置換を実行

上記のテーブルの項目を1つずつ、または以下のスクリプトで一括実行：

---

## 🤖 自動変換スクリプト（Node.js）

以下のスクリプトを`scripts/convert-to-dark-mode.js`として保存：

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 変換マッピング
const replacements = [
  // 背景色
  { from: /bg-white\b/g, to: 'bg-slate-900' },
  { from: /bg-gray-50\b/g, to: 'bg-slate-950' },
  { from: /bg-gray-100\b/g, to: 'bg-slate-800' },
  { from: /bg-gray-200\b/g, to: 'bg-slate-700' },
  { from: /bg-blue-50\b/g, to: 'bg-blue-950' },
  { from: /bg-green-50\b/g, to: 'bg-green-950' },
  { from: /bg-red-50\b/g, to: 'bg-red-950' },
  { from: /bg-yellow-50\b/g, to: 'bg-yellow-950' },
  
  // テキスト色
  { from: /text-gray-900\b/g, to: 'text-slate-50' },
  { from: /text-gray-800\b/g, to: 'text-slate-100' },
  { from: /text-gray-700\b/g, to: 'text-slate-200' },
  { from: /text-gray-600\b/g, to: 'text-slate-300' },
  { from: /text-gray-500\b/g, to: 'text-slate-400' },
  { from: /text-gray-400\b/g, to: 'text-slate-500' },
  
  // ボーダー色
  { from: /border-gray-200\b/g, to: 'border-slate-800' },
  { from: /border-gray-300\b/g, to: 'border-slate-700' },
  { from: /border-gray-400\b/g, to: 'border-slate-600' },
  
  // ホバー状態
  { from: /hover:bg-gray-100\b/g, to: 'hover:bg-slate-800' },
  { from: /hover:bg-gray-200\b/g, to: 'hover:bg-slate-700' },
  { from: /hover:text-gray-900\b/g, to: 'hover:text-slate-50' },
];

// ファイル処理
function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 変換完了: ${filePath}`);
    return 1;
  }
  return 0;
}

// メイン処理
async function main() {
  console.log('🌙 ダークモード変換開始...\n');

  const patterns = [
    'components/**/*.tsx',
    'app/**/*.tsx',
  ];

  let totalFiles = 0;
  let convertedFiles = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/.next/**'],
    });

    files.forEach((file) => {
      totalFiles++;
      convertedFiles += convertFile(file);
    });
  }

  console.log(`\n🎉 完了！`);
  console.log(`総ファイル数: ${totalFiles}`);
  console.log(`変換ファイル数: ${convertedFiles}`);
}

main().catch(console.error);
```

### 実行方法

```bash
# globパッケージをインストール
npm install --save-dev glob

# スクリプト実行
node scripts/convert-to-dark-mode.js
```

---

## ⚠️ 手動調整が必要な箇所

自動変換後、以下は手動で確認・調整してください：

### 1. グラデーション背景

```tsx
// Before
className="bg-gradient-to-br from-blue-50 to-purple-50"

// After
className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
```

### 2. シャドウ

```tsx
// Before
className="shadow-xl"

// After  
className="shadow-2xl shadow-black/50"
```

### 3. リング（フォーカス）

```tsx
// Before
className="ring-blue-500"

// After（そのまま - 青は視認性が良いので変更不要）
className="ring-blue-500 ring-offset-slate-950"
```

### 4. プレースホルダー

```tsx
// Before
placeholder:text-gray-400

// After
placeholder:text-slate-500
```

### 5. 透明度

```tsx
// Before
bg-white/80

// After
bg-slate-900/80
```

---

## 📋 コンポーネント別チェックリスト

### UIコンポーネント（components/ui/）

- [x] globals.css
- [x] Card.tsx
- [x] Input.tsx
- [ ] Button.tsx
- [ ] Textarea.tsx
- [ ] Badge.tsx
- [ ] Progress.tsx
- [ ] Modal.tsx
- [ ] toast.tsx
- [ ] CoinDisplay.tsx
- [ ] CrystalDisplay.tsx
- [ ] StaminaBar.tsx

### ページ（app/）

- [x] layout.tsx
- [ ] page.tsx
- [ ] login/page.tsx
- [ ] signup/page.tsx
- [ ] dashboard/page.tsx

### タスク機能（components/tasks/）

- [ ] TaskCard.tsx
- [ ] TaskList.tsx
- [ ] TaskForm.tsx
- [ ] ChecklistEditor.tsx
- [ ] GenreSelector.tsx
- [ ] DeadlinePicker.tsx

### レイアウト（components/layout/）

- [ ] Header.tsx
- [ ] FilterChips.tsx
- [ ] QuickAddButtons.tsx

### アニメーション（components/animations/）

- [ ] RewardAnimation.tsx
- [ ] LevelUpAnimation.tsx
- [ ] StaminaRecoveryEffect.tsx

---

## 🎨 カラーパレット参照

### スレートカラー

```css
slate-50:   #f8fafc
slate-100:  #f1f5f9
slate-200:  #e2e8f0
slate-300:  #cbd5e1
slate-400:  #94a3b8
slate-500:  #64748b
slate-600:  #475569
slate-700:  #334155
slate-800:  #1e293b
slate-900:  #0f172a
slate-950:  #020617
```

### アクセントカラー（そのまま使用）

- **Blue**: `blue-400, blue-500, blue-600`（プライマリ）
- **Green**: `green-400, green-500, green-600`（成功）
- **Red**: `red-400, red-500, red-600`（エラー）
- **Yellow**: `yellow-400, yellow-500, yellow-600`（警告）
- **Purple**: `purple-400, purple-500, purple-600`（クリスタル）

---

## 🧪 動作確認

変換後、以下を確認：

1. ✅ ログインページが暗い背景で表示される
2. ✅ カードが暗い背景で表示される
3. ✅ テキストが白/明るいグレーで読める
4. ✅ 入力フィールドが暗い背景で表示される
5. ✅ ボタンの色が適切
6. ✅ ホバー状態が視認できる
7. ✅ フォーカス状態が視認できる

---

## 💡 トラブルシューティング

### 問題: テキストが読めない

**原因:** テキスト色が暗すぎる  
**解決:** `text-gray-XXX` → `text-slate-XXX` の数値を下げる

### 問題: 背景が明るすぎる

**原因:** 背景色の変換漏れ  
**解決:** `bg-gray-XXX` を `bg-slate-XXX` に変換

### 問題: ボーダーが見えない

**原因:** ボーダー色が暗すぎる  
**解決:** `border-slate-900` → `border-slate-700`

---

## 📝 変換後のコミット

```bash
git add .
git commit -m "feat: ダークモード対応 - 全コンポーネント"
```
