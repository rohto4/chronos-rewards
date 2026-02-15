# Chronos Rewards - 実装ロードマップ

最終更新日: 2026年2月14日

---

## 📊 プロジェクト現状

### 完成度
- **全体進捗**: 80% 完成
- **実装済み**: Phase 1-5（コアUI、認証、タスク機能、報酬表示、アニメーション）
- **未実装**: Phase 6-9（統計、コア機能の完成、追加機能、品質向上）

### 🔴 致命的な未実装
1. **報酬システムの未統合** - reward-utils が実際に使われていない
2. **タスク詳細モーダル欠如** - 編集・履歴表示ができない
3. **チェックリストのDB保存欠如** - データ整合性の問題

### 🎯 目標
- **短期（2週間）**: Phase 7 完了（コア機能の完成）
- **中期（1ヶ月）**: Phase 8 完了（追加機能）
- **長期（2ヶ月）**: Phase 9 完了（品質向上）

---

## 🚀 Phase 7: コア機能の完成（優先度: 最高）

**総推定工数**: 18時間
**目標期間**: 2週間

### 7.1 報酬システムの統合（最優先）

#### 7.1.1 user-store の拡張（3h）

**ファイル**: `lib/stores/user-store.ts`

**実装内容**:
```typescript
// 追加する関数
- addCoins(amount: number): Promise<void>
- addCrystals(amount: number): Promise<void>
- consumeStamina(amount: number): Promise<boolean>
- checkStamina(required: number): boolean
```

**詳細**:
1. `addCoins`: コイン加算＋DB更新＋アニメーション発火
2. `addCrystals`: クリスタル加算＋DB更新＋レベルアップチェック
3. `consumeStamina`: スタミナ消費＋不足チェック＋エラーハンドリング
4. `checkStamina`: スタミナ事前チェック（タスク作成前）

**技術要件**:
- Supabase RPC 関数呼び出し
- 楽観的更新（Optimistic Update）
- エラーハンドリング＋ロールバック

**テストケース**:
- コイン加算が正常に動作
- 残高不足時のエラーハンドリング
- 同時実行時の競合処理

---

#### 7.1.2 task-store への報酬計算統合（4h）

**ファイル**: `lib/stores/task-store.ts`

**実装内容**:
1. `createTask` の拡張
   - タスク作成前にスタミナチェック
   - 詳細度計算（calculateDetailLevel）
   - コイン報酬計算（calculateCoinReward）
   - スタミナ消費
   - コイン付与＋アニメーション

2. `completeTask` の拡張
   - クリスタル報酬計算（calculateCrystalReward）
   - 親タスク判定（子タスクの有無チェック）
   - クリスタル付与＋アニメーション
   - レベルアップチェック

3. `updateTask` の拡張（編集時）
   - 詳細度向上ボーナス計算（calculateEditBonusCoin）
   - スタミナ消費
   - ボーナスコイン付与

**技術要件**:
- reward-utils 関数の統合
- user-store との連携
- トランザクション的な処理（失敗時はロールバック）

**データフロー**:
```
createTask
  ├─ スタミナチェック（checkStamina）
  ├─ 詳細度計算（calculateDetailLevel）
  ├─ コイン報酬計算（calculateCoinReward）
  ├─ Supabase INSERT
  ├─ スタミナ消費（consumeStamina）
  └─ コイン付与（addCoins）

completeTask
  ├─ クリスタル報酬計算（calculateCrystalReward）
  ├─ 親タスク判定（getChildTasks）
  ├─ Supabase UPDATE
  └─ クリスタル付与（addCrystals）
```

**エラーハンドリング**:
- スタミナ不足エラー → トースト表示
- DB更新失敗 → ロールバック＋エラー通知
- ネットワークエラー → リトライ機構

---

#### 7.1.3 dashboard のクリスタル計算修正（1h）

**ファイル**: `app/dashboard/page.tsx`

**変更箇所**:
```typescript
// 修正前（line 123）
setRewardAnimation({ type: 'crystal', amount: 50 }); // TODO: 実際のクリスタル数を計算

// 修正後
const crystalAmount = calculateCrystalReward(
  task.estimated_hours,
  task.has_prerequisites,
  task.has_benefits,
  getChildTasks(task.id).length > 0
);
setRewardAnimation({ type: 'crystal', amount: crystalAmount });
```

**追加処理**:
- task-store の completeTask が既にクリスタル計算＋付与を行うため、
  dashboard 側はアニメーション表示のみに専念
- task-store から報酬額を返すように修正

---

### 7.2 タスク詳細モーダルの実装（6h）

#### 7.2.1 TaskDetailModal コンポーネント作成（4h）

**ファイル**: `components/tasks/TaskDetailModal.tsx`

**機能要件**:
1. **基本情報表示**
   - タイトル、説明、ジャンル
   - 期限、見積時間、詳細レベル
   - ベネフィット

2. **チェックリスト**
   - チェックボックスのON/OFF
   - リアルタイム保存（デバウンス）
   - 進捗バー更新

3. **編集モード**
   - インライン編集
   - TaskForm の埋め込み
   - 保存・キャンセル

4. **履歴表示**
   - 作成日時、更新日時、完了日時
   - 獲得報酬履歴（コイン・クリスタル）

5. **親子タスク表示**
   - 親タスクへのリンク
   - 子タスク一覧（完了状態）

**UI構成**:
```
┌─────────────────────────────────┐
│ [×] タスク詳細                    │
├─────────────────────────────────┤
│ タイトル                          │
│ ジャンルバッジ  期限バッジ         │
│                                  │
│ 説明文...                         │
│                                  │
│ ✓ チェックリスト                  │
│   □ アイテム1                     │
│   ☑ アイテム2                     │
│   □ アイテム3                     │
│   進捗: 33% [████░░░░░░]         │
│                                  │
│ 📊 詳細情報                       │
│   見積時間: 5h                    │
│   詳細レベル: ★★★★☆              │
│   ベネフィット: ...               │
│                                  │
│ 📈 獲得報酬                       │
│   💰 +120 コイン                 │
│   💎 +50 クリスタル（完了時）      │
│                                  │
│ 📅 履歴                           │
│   作成: 2026/02/10 14:30         │
│   更新: 2026/02/12 09:15         │
│                                  │
│ [編集] [完了] [削除]              │
└─────────────────────────────────┘
```

**技術要件**:
- Modal コンポーネントの再利用
- Framer Motion によるスライドイン
- チェックリストのリアルタイム保存（useDebounce）
- 楽観的更新

---

#### 7.2.2 dashboard への統合（1h）

**ファイル**: `app/dashboard/page.tsx`

**変更箇所**:
```typescript
// line 192 修正
onClick={() => {
  // TODO: タスク詳細表示
}}

// ↓ 修正後

const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

onClick={() => {
  setSelectedTaskId(task.id);
}}

// モーダル追加
{selectedTaskId && (
  <TaskDetailModal
    taskId={selectedTaskId}
    onClose={() => setSelectedTaskId(null)}
    onEdit={handleEditTask}
    onComplete={handleCompleteTask}
    onDelete={handleDeleteTask}
  />
)}
```

---

#### 7.2.3 チェックリストDB保存の実装（1h）

**ファイル**: `lib/stores/task-store.ts`

**実装内容**:
1. `updateTaskChecklist`: チェックリスト更新専用関数
2. Supabase `task_checklist` テーブルへの UPSERT
3. デバウンス処理（500ms）

**SQL処理**:
```sql
-- チェックリスト項目の更新
INSERT INTO task_checklist (task_id, title, is_checked, sort_order)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) DO UPDATE SET
  is_checked = EXCLUDED.is_checked,
  updated_at = NOW();
```

---

### 7.3 クイック登録の期限自動設定（2h）

#### 7.3.1 QuickAddButtons の修正

**ファイル**: `components/layout/QuickAddButtons.tsx`

**変更内容**:
```typescript
// 修正前（line 48-58）
const handleQuickAddToday = () => {
  setIsModalOpen(true);
  setIsExpanded(false);
};

const handleQuickAddWeek = () => {
  setIsModalOpen(true);
  setIsExpanded(false);
};

// ↓ 修正後

const [initialDeadline, setInitialDeadline] = useState<string | null>(null);

const handleQuickAddToday = () => {
  const today = endOfDay(new Date());
  setInitialDeadline(today.toISOString());
  setIsModalOpen(true);
  setIsExpanded(false);
};

const handleQuickAddWeek = () => {
  const nextWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
  setInitialDeadline(nextWeek.toISOString());
  setIsModalOpen(true);
  setIsExpanded(false);
};

// モーダルに渡す
<TaskForm
  initialDeadline={initialDeadline}
  onSubmit={handleCreateTask}
  onCancel={() => {
    setIsModalOpen(false);
    setInitialDeadline(null);
  }}
/>
```

---

#### 7.3.2 TaskForm の修正

**ファイル**: `components/tasks/TaskForm.tsx`

**変更内容**:
```typescript
export interface TaskFormProps {
  task?: TaskWithGenre | null;
  initialDeadline?: string | null; // ← 追加
  onSubmit: (task: TaskInsert | TaskUpdate) => Promise<void>;
  onCancel: () => void;
}

// useState の初期値を変更
const [deadline, setDeadline] = useState(
  task?.deadline ??
  initialDeadline ??
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
);
```

---

## 🎨 Phase 8: 追加機能（優先度: 中）

**総推定工数**: 31時間
**目標期間**: 3週間

### 8.1 カレンダーコンポーネント（8h）

**ファイル**: `components/ui/Calendar.tsx`

**機能要件**:
1. 月間カレンダー表示
2. タスク数のバッジ表示
3. 日付クリックでタスク一覧表示
4. 月の切り替え（前月・翌月）
5. 今日の日付ハイライト

**技術スタック**:
- date-fns（日付計算）
- Tailwind CSS Grid（カレンダーレイアウト）
- Framer Motion（月切り替えアニメーション）

**UI構成**:
```
┌──────────────────────────────────┐
│  ← 2026年2月 →                    │
├──────────────────────────────────┤
│ 日 月 火 水 木 金 土               │
├──────────────────────────────────┤
│    01 02 03 04 05 06 07          │
│    📌 📌       📌                 │
│                                  │
│ 08 09 10 11 12 13 14             │
│       📌📌  📌                    │
│                                  │
│ 15 16 17 18 19 20 21             │
│ 📌📌  📌                          │
│                                  │
│ 22 23 24 25 26 27 28             │
│    📌  📌  📌                     │
└──────────────────────────────────┘
```

---

### 8.2 カレンダービューページ（6h）

**ファイル**: `app/calendar/page.tsx`

**機能要件**:
1. Calendar コンポーネントの統合
2. 選択日のタスク一覧表示
3. 月間統計（完了数・獲得報酬）
4. タスク作成のクイックアクセス

**レイアウト**:
```
┌────────────────────────────────┐
│ Header                          │
├────────────────────────────────┤
│                                 │
│  [カレンダー]    [選択日タスク] │
│                                 │
│  月間カレンダー   2/14 のタスク │
│  表示           ├───────────────┤
│                 │ □ タスク1     │
│                 │ ☑ タスク2     │
│                 │ □ タスク3     │
│                 └───────────────┘
│                                 │
│  [月間統計]                     │
│  完了: 12/25                    │
│  報酬: 💰1,200 💎450           │
└────────────────────────────────┘
```

---

### 8.3 統計ダッシュボードページ（8h）

**ファイル**: `app/statistics/page.tsx`

**機能要件**:
1. **期間選択** - 週間・月間・年間
2. **タスク完了数グラフ** - 棒グラフ
3. **報酬推移グラフ** - 折れ線グラフ
4. **ジャンル別統計** - 円グラフ
5. **達成率** - プログレスバー
6. **レベル進捗** - XPバー

**技術スタック**:
- Recharts（グラフライブラリ）
- date-fns（期間計算）
- Zustand（統計データ管理）

**データ取得**:
```sql
-- 期間別完了タスク数
SELECT
  DATE(completed_at) as date,
  COUNT(*) as count,
  SUM(crystal_reward) as crystals
FROM tasks
WHERE completed_at BETWEEN $1 AND $2
GROUP BY DATE(completed_at);

-- ジャンル別統計
SELECT
  g.name,
  COUNT(*) as count
FROM tasks t
JOIN task_genres g ON t.genre_id = g.id
WHERE t.is_completed = true
GROUP BY g.name;
```

---

### 8.4 グラフコンポーネント（6h）

**ファイル**: `components/ui/Chart.tsx`

**機能要件**:
1. BarChart（棒グラフ）
2. LineChart（折れ線グラフ）
3. PieChart（円グラフ）
4. AreaChart（エリアグラフ）

**props設計**:
```typescript
interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}
```

---

### 8.5 ダークモード（5h）

#### 8.5.1 useTheme フック作成（2h）

**ファイル**: `lib/hooks/useTheme.ts`

**実装内容**:
```typescript
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  return { theme, toggleTheme };
};
```

---

#### 8.5.2 Tailwind CSS 設定（1h）

**ファイル**: `tailwind.config.ts`

**変更内容**:
```javascript
module.exports = {
  darkMode: 'class', // ← 追加
  // ... 既存設定
}
```

---

#### 8.5.3 コンポーネントのダークモード対応（2h）

**対象ファイル**:
- `globals.css` - ダークモード用カラー定義
- `Card.tsx` - dark:bg-gray-800 等
- `Input.tsx` - dark:bg-gray-700 等
- `Button.tsx` - dark:bg-blue-700 等

---

### 8.6 CSV/JSONエクスポート（4h）

**ファイル**: `lib/utils/export-utils.ts`

**機能要件**:
1. タスクデータのCSVエクスポート
2. タスクデータのJSONエクスポート
3. 統計データのエクスポート
4. ファイルダウンロード処理

**実装例**:
```typescript
export const exportTasksAsCSV = (tasks: Task[]) => {
  const csv = [
    ['タイトル', 'ジャンル', '期限', '完了'],
    ...tasks.map(t => [t.title, t.genre?.name, t.deadline, t.is_completed])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks_${format(new Date(), 'yyyyMMdd')}.csv`;
  a.click();
};
```

---

## 📈 Phase 9: 品質向上（優先度: 低）

**総推定工数**: 23時間
**目標期間**: 2週間

### 9.1 動的インポート導入（3h）

**対象コンポーネント**:
- RewardAnimation
- LevelUpAnimation
- TaskDetailModal
- Calendar

**実装例**:
```typescript
const TaskDetailModal = dynamic(
  () => import('@/components/tasks/TaskDetailModal'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);
```

---

### 9.2 画像最適化（2h）

**実装内容**:
1. Next.js Image コンポーネント導入
2. アイコン画像の最適化
3. アバター画像の遅延読み込み

---

### 9.3 テストカバレッジ向上（12h）

**目標**: 60%以上のカバレッジ

**優先テスト対象**:
1. reward-utils（報酬計算ロジック）- 4h
2. task-store（タスクCRUD）- 3h
3. user-store（ユーザー管理）- 3h
4. TaskDetailModal（複雑なUI）- 2h

**テストフレームワーク**:
- Vitest
- Testing Library
- MSW（API モック）

---

### 9.4 スクリーンリーダー対応（6h）

**実装内容**:
1. aria-label の追加
2. role 属性の設定
3. フォーカス管理
4. キーボードナビゲーション

**対象コンポーネント**:
- Modal（Escape キー対応済み）
- TaskCard（Enter で詳細表示）
- Header（タブナビゲーション）

---

## 📅 マイルストーン

### Milestone 1: コア機能完成（2週間後）
- ✅ 報酬システム統合
- ✅ タスク詳細モーダル
- ✅ チェックリストDB保存
- ✅ クイック登録改善

**成功基準**:
- タスク作成でコイン付与される
- タスク完了でクリスタル付与される
- タスククリックで詳細表示される
- クイック登録で期限が自動設定される

---

### Milestone 2: 追加機能実装（1ヶ月後）
- ✅ カレンダービュー
- ✅ 統計ダッシュボード
- ✅ ダークモード
- ✅ エクスポート機能

**成功基準**:
- カレンダーで月間タスクを確認できる
- グラフで進捗を可視化できる
- ダークモードに切り替えられる
- タスクデータをエクスポートできる

---

### Milestone 3: 品質向上（2ヶ月後）
- ✅ テストカバレッジ 60%以上
- ✅ パフォーマンス最適化
- ✅ アクセシビリティ対応

**成功基準**:
- Lighthouse スコア 90点以上
- 初期ロード時間 2秒以内
- WCAG 2.1 AA準拠

---

## 🔧 技術的考慮事項

### データベース変更

**必要な変更**:
1. `task_checklist` テーブルの UPSERT 処理
2. 報酬履歴テーブルの追加（オプション）
3. インデックスの最適化

**SQL追加**:
```sql
-- 報酬履歴テーブル（オプション）
CREATE TABLE reward_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  task_id UUID REFERENCES tasks(id),
  reward_type VARCHAR(20), -- 'coin' | 'crystal'
  amount INTEGER,
  reason VARCHAR(100), -- 'task_create' | 'task_complete' | 'task_edit'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_reward_history_user_id ON reward_history(user_id);
CREATE INDEX idx_reward_history_created_at ON reward_history(created_at);
```

---

### パフォーマンス最適化

**実装項目**:
1. React.memo による再レンダリング抑制
2. useMemo/useCallback の適切な使用
3. 仮想スクロール（タスク一覧が100件以上）
4. デバウンス（検索・フィルタ）

---

### エラーハンドリング

**戦略**:
1. Supabase エラーのハンドリング
2. ネットワークエラーのリトライ
3. 楽観的更新の失敗時ロールバック
4. エラーバウンダリの設置

---

### セキュリティ

**チェック項目**:
1. RLS（Row Level Security）の確認
2. API キーの環境変数化
3. XSS対策（入力サニタイズ）
4. CSRF対策（Supabase が対応済み）

---

## 📝 実装順序（推奨）

### Week 1-2: Phase 7（コア機能完成）
1. Day 1-2: user-store 拡張（報酬関数追加）
2. Day 3-5: task-store 報酬計算統合
3. Day 6-7: dashboard クリスタル計算修正
4. Day 8-10: TaskDetailModal 実装
5. Day 11-12: チェックリストDB保存
6. Day 13-14: クイック登録改善

### Week 3-5: Phase 8（追加機能）
1. Day 15-17: Calendar コンポーネント
2. Day 18-20: カレンダービューページ
3. Day 21-23: Chart コンポーネント
4. Day 24-28: 統計ダッシュボード
5. Day 29-31: ダークモード
6. Day 32-33: エクスポート機能

### Week 6-7: Phase 9（品質向上）
1. Day 34-36: 動的インポート
2. Day 37-38: 画像最適化
3. Day 39-50: テスト追加
4. Day 51-56: アクセシビリティ対応

---

## 🎯 次のアクション

### 今すぐ始めるべきタスク（Phase 7.1.1）

**タスク**: user-store の拡張
**推定時間**: 3時間
**ファイル**: `lib/stores/user-store.ts`

**実装内容**:
1. `addCoins` 関数の追加
2. `addCrystals` 関数の追加
3. `consumeStamina` 関数の追加
4. `checkStamina` 関数の追加

**承認が必要な項目**:
- なし（既存設計に従う）

**開始条件**:
- 現在のコードを読んで理解済み ✅
- reward-utils の仕様を理解済み ✅
- Supabase の接続確認済み ✅

---

## 📊 進捗トラッキング

### Phase 7 チェックリスト
- [ ] 7.1.1: user-store 拡張
- [ ] 7.1.2: task-store 報酬統合
- [ ] 7.1.3: dashboard クリスタル計算修正
- [ ] 7.2.1: TaskDetailModal 作成
- [ ] 7.2.2: dashboard への統合
- [ ] 7.2.3: チェックリストDB保存
- [ ] 7.3.1: QuickAddButtons 修正
- [ ] 7.3.2: TaskForm 修正

### Phase 8 チェックリスト
- [ ] 8.1: Calendar コンポーネント
- [ ] 8.2: カレンダービューページ
- [ ] 8.3: 統計ダッシュボード
- [ ] 8.4: Chart コンポーネント
- [ ] 8.5: ダークモード
- [ ] 8.6: エクスポート機能

### Phase 9 チェックリスト
- [ ] 9.1: 動的インポート
- [ ] 9.2: 画像最適化
- [ ] 9.3: テストカバレッジ向上
- [ ] 9.4: スクリーンリーダー対応

---

## 🏁 完成の定義

プロジェクトが「完成」と見なされる基準:

1. ✅ すべてのコア機能が動作
2. ✅ 報酬システムが正常に機能
3. ✅ 統計・分析機能が実装済み
4. ✅ テストカバレッジ 60%以上
5. ✅ パフォーマンス Lighthouse 90点以上
6. ✅ アクセシビリティ WCAG 2.1 AA準拠
7. ✅ ドキュメントが最新
8. ✅ 既知のバグがゼロ

---

**最終更新**: 2026年2月14日
**次回レビュー**: Phase 7 完了時
