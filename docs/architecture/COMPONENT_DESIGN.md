# コンポーネント設計書

Chronos RewardsのReactコンポーネント設計仕様書

---

## 📋 概要

このドキュメントでは、アプリケーションのUIコンポーネント構成、Props、State管理について定義します。

---

## 🏗️ コンポーネント階層

```
app/
├── layout.tsx (RootLayout)
└── page.tsx (DashboardPage)
    ├── Header
    │   ├── UserAvatar
    │   └── RewardDisplay
    │       ├── CoinDisplay
    │       ├── CrystalDisplay
    │       └── StaminaBar
    ├── FilterSection
    │   ├── PeriodFilterChips
    │   └── GenreFilterChips
    ├── TaskList
    │   └── TaskCard (複数)
    │       ├── TaskTitle
    │       ├── TaskMeta (deadline, genre, estimated_hours)
    │       ├── TaskProgress
    │       ├── ChecklistPreview
    │       └── SwipeActions
    └── QuickAddButtons
        ├── ShortTermButton
        └── LongTermButton

TaskFormModal
├── TaskFormHeader
├── TaskFormBody
│   ├── TitleInput
│   ├── DescriptionTextarea
│   ├── GenreSelector
│   ├── DeadlinePicker
│   ├── EstimatedHoursInput
│   ├── BenefitsTextarea
│   └── ChecklistEditor
└── TaskFormFooter
    ├── StaminaCostDisplay
    ├── CoinRewardPreview
    └── SubmitButton
```

---

## 🎨 基本UIコンポーネント

### Button

汎用ボタンコンポーネント

```typescript
interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
```

**バリアント:**
- `default`: 標準ボタン
- `primary`: プライマリアクション（タスク作成等）
- `secondary`: セカンダリアクション
- `destructive`: 削除等の危険なアクション
- `ghost`: 背景透明のテキストボタン

**使用例:**
```tsx
<Button variant="primary" size="lg" onClick={handleCreate}>
  作成
</Button>
```

---

### Card

カード型コンテナ

```typescript
interface CardProps {
  variant?: 'default' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}
```

**バリアント:**
- `default`: 標準カード
- `glass`: グラスモーフィズム効果（タスクカード用）

---

### Input

テキスト入力フィールド

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**使用例:**
```tsx
<Input
  label="タスク名"
  placeholder="例: 資料作成"
  error={errors.title}
  leftIcon={<FileTextIcon />}
/>
```

---

### Textarea

複数行テキスト入力

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
}
```

---

### Select

セレクトボックス

```typescript
interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}
```

---

### Modal / Dialog

モーダルダイアログ

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}
```

---

### Toast

通知トースト

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // ミリ秒（デフォルト: 3000）
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right';
}

// 使用例
showToast({
  message: 'タスクを作成しました',
  type: 'success',
});
```

---

### Badge

バッジ（ラベル表示）

```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

---

## 🎯 機能別コンポーネント

### Header

アプリケーションヘッダー

```typescript
interface HeaderProps {
  // Zustandから取得するため、Propsは不要
}

// 内部で使用するデータ
const { profile } = useUserStore();
```

**表示内容:**
- アプリタイトル
- ユーザーアバター
- コイン・クリスタル・スタミナ表示

---

### RewardDisplay

報酬表示コンポーネント群

#### CoinDisplay

```typescript
interface CoinDisplayProps {
  amount: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**機能:**
- コイン数を表示
- 増加時にカウントアップアニメーション
- コインアイコンのグロー効果

#### CrystalDisplay

```typescript
interface CrystalDisplayProps {
  amount: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**機能:**
- クリスタル数を表示
- 増加時に回転アニメーション
- クリスタルアイコンのキラキラ効果

#### StaminaBar

```typescript
interface StaminaBarProps {
  current: number;
  max: number;
  showRecoveryTime?: boolean;
}
```

**機能:**
- スタミナゲージ表示（0-100）
- ステータス別の色分け（low: 赤、medium: 黄、high: 緑）
- 全回復までの時間表示（オプション）

---

### FilterSection

フィルタセクション

```typescript
interface FilterSectionProps {
  // Zustandから取得するため、Propsは最小限
}

const { filters, togglePeriodFilter, toggleGenreFilter } = useTaskStore();
const { genres } = useGenreStore();
```

#### PeriodFilterChips

期間フィルタチップ群

```typescript
interface PeriodFilterChipsProps {
  selected: FilterPeriod[];
  onToggle: (period: FilterPeriod) => void;
}
```

**表示チップ:**
- 今日
- 今週
- 2週間
- 1ヶ月
- 3ヶ月
- 1年
- 3年

**動作:**
- 複数選択可能
- 選択済みはハイライト表示
- クリックでトグル

#### GenreFilterChips

ジャンルフィルタチップ群

```typescript
interface GenreFilterChipsProps {
  genres: TaskGenre[];
  selected: string[];
  onToggle: (genreId: string) => void;
}
```

**機能:**
- ジャンル一覧を表示
- ジャンルカラーで色分け
- 複数選択可能

---

### TaskList

タスク一覧表示

```typescript
interface TaskListProps {
  // Zustandから取得
}

const { filteredTasks } = useTaskStore();
```

**機能:**
- フィルタ後のタスク一覧を表示
- 空の場合は Empty State を表示
- グリッドレイアウト（PC）またはリスト（スマホ）

---

### TaskCard

タスクカード（最重要コンポーネント）

```typescript
interface TaskCardProps {
  task: TaskWithGenre;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onClick: (taskId: string) => void;
}
```

**表示要素:**
- タスクタイトル
- 期限（緊急度で色分け）
- ジャンル（カラーマーク）
- 重さ（estimated_hours）
- 進捗バー（親タスクの場合）
- チェックリストプレビュー（3件まで）
- 完了ボタン / 編集ボタン / 削除ボタン

**スワイプ操作（スマホ）:**
- 右スワイプ → 完了
- 左スワイプ → 削除

**ホバー操作（PC）:**
- ホバー時にアクションボタン表示

**アニメーション:**
- 完了時: チェックマークアニメーション + クリスタル飛ぶ
- 削除時: フェードアウト
- 作成時: スライドイン

---

### TaskFormModal

タスク作成・編集フォーム

```typescript
interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: Partial<Task>;
  defaultDeadline?: Date; // クイック登録用
  defaultEstimatedHours?: number; // クイック登録用
}
```

**フォームフィールド:**

#### 基本情報
- タイトル（必須）
- 内容（任意、10文字以上で詳細度+1）
- ジャンル（任意、プルダウン or 新規入力）
- 期限（必須、カレンダーピッカー）
- 重さ（必須、1-999時間）

#### 詳細情報
- メリット（任意、10文字以上で詳細度+1）
- 前提条件チェックリスト（任意、3個以上で詳細度+1）

#### フッター情報
- 詳細度プレビュー（1-5星）
- 獲得予定コイン
- 消費スタミナ
- 完了時獲得予定クリスタル

**バリデーション:**
- タイトル: 1-200文字
- 内容: 0-2000文字
- メリット: 0-1000文字
- 期限: 未来の日時のみ
- 重さ: 0.5-999時間

**スタミナ不足時:**
- 送信ボタンを無効化
- 警告メッセージ表示
- スタミナ回復時間を表示

---

### QuickAddButtons

クイック登録ボタン群

```typescript
interface QuickAddButtonsProps {
  onShortTermClick: () => void;
  onLongTermClick: () => void;
}
```

**Short Term Button:**
- デフォルト: 今週、1時間
- アイコン: ⚡
- カラー: Primary

**Long Term Button:**
- デフォルト: 3ヶ月、10時間
- アイコン: 🎯
- カラー: Secondary

**配置:**
- PC: 右下固定
- スマホ: 下部固定（横並び）

---

### ChecklistEditor

チェックリスト編集コンポーネント

```typescript
interface ChecklistEditorProps {
  items: TaskChecklistItem[];
  onChange: (items: TaskChecklistItem[]) => void;
  maxItems?: number; // デフォルト: 20
}
```

**機能:**
- 項目追加（Enter or + ボタン）
- 項目削除（× ボタン）
- ドラッグ＆ドロップで並び替え
- チェック状態のトグル

---

### GenreSelector

ジャンル選択コンポーネント

```typescript
interface GenreSelectorProps {
  value?: string;
  onChange: (genreId: string) => void;
  allowCreate?: boolean;
}
```

**機能:**
- 既存ジャンルをプルダウン表示
- 使用回数順にソート
- ジャンルカラーで色分け
- 新規ジャンル作成（テキスト入力）

---

### DeadlinePicker

期限日時選択コンポーネント

```typescript
interface DeadlinePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}
```

**機能:**
- カレンダー表示
- 時刻選択（時:分）
- クイック選択ボタン（今日、明日、来週、来月）

---

## 🎭 アニメーションコンポーネント

### RewardAnimation

報酬獲得アニメーション

```typescript
interface RewardAnimationProps {
  type: 'coin' | 'crystal';
  amount: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete: () => void;
}
```

**アニメーション:**
- コイン: 浮遊しながら上昇＋フェードアウト（1秒）
- クリスタル: 回転しながら上昇＋フェードアウト（1.5秒）

---

### LevelUpAnimation

レベルアップ（詳細度向上）アニメーション

```typescript
interface LevelUpAnimationProps {
  oldLevel: number;
  newLevel: number;
  onComplete: () => void;
}
```

**アニメーション:**
- 星が1つずつ増える演出
- ボーナスコイン表示

---

### StaminaRecoveryEffect

スタミナ回復エフェクト

```typescript
interface StaminaRecoveryEffectProps {
  amount: number;
  onComplete: () => void;
}
```

**アニメーション:**
- 波紋エフェクト
- 回復量のカウントアップ

---

## 📱 レスポンシブ対応

### ブレークポイント

```typescript
const breakpoints = {
  sm: '640px',  // スマホ
  md: '768px',  // タブレット
  lg: '1024px', // PC
  xl: '1280px', // 大画面PC
};
```

### レイアウト切り替え

**PC（lg以上）:**
- タスク: グリッド表示（2-3カラム）
- フィルタ: 横並び
- クイック登録: 右下固定

**スマホ（lg未満）:**
- タスク: シングルカラム
- フィルタ: 横スクロール
- クイック登録: 下部固定

---

## 🎨 デザインシステム

### カラーパレット

```typescript
const colors = {
  // 報酬カラー
  coin: '#F59E0B',      // ゴールド
  crystal: '#A855F7',   // 紫
  stamina: {
    high: '#10B981',    // 緑
    medium: '#F59E0B',  // 黄
    low: '#EF4444',     // 赤
  },
  
  // UI
  background: '#0F172A',
  foreground: '#F1F5F9',
  primary: '#3B82F6',
  secondary: '#64748B',
  destructive: '#DC2626',
  muted: '#475569',
  border: '#334155',
};
```

### タイポグラフィ

```typescript
const typography = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  body: 'text-base',
  caption: 'text-sm text-muted-foreground',
};
```

### スペーシング

```typescript
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
};
```

---

## 🔌 コンポーネント間の通信

### Zustandストアの利用

```typescript
// コンポーネント内
import { useUserStore } from '@/lib/stores/user-store';
import { useTaskStore } from '@/lib/stores/task-store';

function MyComponent() {
  const { profile } = useUserStore();
  const { filteredTasks, createTask } = useTaskStore();
  
  // ...
}
```

### イベント伝播

- 子→親: Propsでコールバック関数を渡す
- 兄弟間: 共通の親経由 or Zustand経由
- グローバル: Zustandストア

---

## 📝 実装優先順位

### Phase 1: 基本UI（必須）
1. Button, Card, Input, Textarea
2. Modal, Toast
3. Badge, Progress

### Phase 2: 機能コンポーネント（必須）
1. Header, RewardDisplay
2. TaskCard（基本版）
3. TaskFormModal（基本版）
4. QuickAddButtons

### Phase 3: 高度な機能（推奨）
1. FilterSection
2. TaskCard（スワイプ対応）
3. ChecklistEditor
4. GenreSelector

### Phase 4: アニメーション（拡張）
1. RewardAnimation
2. LevelUpAnimation
3. StaminaRecoveryEffect

---

## 🔗 参考リンク

- [Tailwind CSS Components](https://tailwindcss.com/docs/reusing-styles)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Swipeable](https://github.com/FormidableLabs/react-swipeable)
