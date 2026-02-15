# Official Technical Documentation & References
# 技術リファレンス用

## 1. Core Framework & UI
- **Next.js (App Router) Documentation**
  https://nextjs.org/docs
- **Tailwind CSS Documentation**
  https://tailwindcss.com/docs
- **Lucide React (Icons)**
  https://lucide.dev/guide/packages/lucide-react
- **Framer Motion (Animations)**
  https://www.framer.com/motion/
- **Class Variance Authority (CVA)**
  https://cva.style/docs
- **clsx & tailwind-merge**
  https://github.com/dcastil/tailwind-merge

## 2. Backend & Database (Realtime Sync)
- **Supabase Documentation (General)**
  https://supabase.com/docs
- **Supabase Database (PostgreSQL)**
  https://supabase.com/docs/guides/database
- **Supabase Realtime (Sync between PC and Mobile)**
  https://supabase.com/docs/guides/realtime
- **Supabase Auth (Authentication)**
  https://supabase.com/docs/guides/auth
- **Supabase Auth Helpers for Next.js**
  https://supabase.com/docs/guides/auth/auth-helpers/nextjs

## 3. PWA & Mobile Optimization
- **Next-PWA (Plugin for Next.js)**
  https://github.com/shadowwalker/next-pwa
- **MDN Web Docs: Progressive Web Apps (PWA)**
  https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps
- **Google Search Central: PWA Best Practices**
  https://developers.google.com/search/docs/appearance/progressive-web-apps

## 4. Design & UI Components
- **Material Design 3 (UI Components)**
  https://m3.material.io/
- **Shadcn/ui (Component Library - 参考)**
  https://ui.shadcn.com/
- **Radix UI (Accessible Components - 参考)**
  https://www.radix-ui.com/
- **Web Storage API (Offline Caching)**
  https://developer.mozilla.org/ja/docs/Web/API/Web_Storage_API
  
## 5. State Management & Data Fetching
- **Zustand (軽量State管理)**
  https://github.com/pmndrs/zustand
- **Zustand Middleware (Persist, Immer, etc.)**
  https://github.com/pmndrs/zustand#middleware
- **TanStack Query (React Query)**
  https://tanstack.com/query/latest
- **SWR (Vercel製データフェッチング)**
  https://swr.vercel.app/

## 6. Form & Validation
- **React Hook Form**
  https://react-hook-form.com/
- **Zod (TypeScript-first Schema Validation)**
  https://zod.dev/

## 7. Date & Time
- **date-fns (軽量日付ライブラリ)**
  https://date-fns.org/
- **date-fns Locale (日本語対応)**
  https://date-fns.org/docs/I18n

## 7.5. Charts & Data Visualization
- **Recharts (React向けチャートライブラリ)**
  https://recharts.org/
- **Recharts Examples**
  https://recharts.org/en-US/examples

## 8. Drag & Drop / Swipe
- **react-swipeable (スワイプ操作)**
  https://github.com/FormidableLabs/react-swipeable
- **dnd-kit (ドラッグ&ドロップ)**
  https://dndkit.com/

## 9. Animation & Motion
- **Framer Motion API Reference**
  https://www.framer.com/motion/component/
- **Framer Motion AnimatePresence**
  https://www.framer.com/motion/animate-presence/
- **Framer Motion Gestures (Drag, Hover, Tap)**
  https://www.framer.com/motion/gestures/
- **CSS Gradient Generator (背景用)**
  https://cssgradient.io/

## 10. TypeScript & Type Safety
- **TypeScript Documentation**
  https://www.typescriptlang.org/docs/
- **TypeScript Utility Types**
  https://www.typescriptlang.org/docs/handbook/utility-types.html
- **Supabase TypeScript Support**
  https://supabase.com/docs/guides/api/generating-types

## 11. Testing (オプション)
- **Vitest (高速テストランナー)**
  https://vitest.dev/
- **React Testing Library**
  https://testing-library.com/docs/react-testing-library/intro/
- **Playwright (E2Eテスト)**
  https://playwright.dev/

## 12. Development Tools
- **ESLint (Next.js)**
  https://nextjs.org/docs/app/building-your-application/configuring/eslint
- **Prettier**
  https://prettier.io/docs/en/
- **TypeScript ESLint**
  https://typescript-eslint.io/

## 13. Component Development Best Practices
- **React Forwardref Pattern**
  https://react.dev/reference/react/forwardRef
- **React Portal (for Modals)**
  https://react.dev/reference/react-dom/createPortal
- **React useEffect Best Practices**
  https://react.dev/learn/synchronizing-with-effects
- **Compound Components Pattern**
  https://www.patterns.dev/react/compound-pattern

## 14. Accessibility (a11y)
- **WAI-ARIA Authoring Practices**
  https://www.w3.org/WAI/ARIA/apg/
- **MDN: ARIA Labels**
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label
- **WebAIM Color Contrast Checker**
  https://webaim.org/resources/contrastchecker/

## 15. Performance Optimization
- **Next.js Image Optimization**
  https://nextjs.org/docs/app/building-your-application/optimizing/images
- **React Memo & useMemo**
  https://react.dev/reference/react/memo
- **Web Vitals (Core Web Vitals)**
  https://web.dev/vitals/

## 実装済みコンポーネントのリファレンス

### Phase 1: 基本UI
- Button, Card, Input, Textarea, Badge, Progress, Modal, Toast

### Phase 2: 認証・レイアウト
- AuthProvider (Supabase Auth統合)
- Header (報酬・スタミナ表示)
- LoginPage, DashboardPage

### Phase 3: タスク機能
- TaskCard (期限色分け、チェックリスト進捗)
- TaskList (期限別グループ化)
- TaskForm (作成・編集フォーム)
- ChecklistEditor, GenreSelector, DeadlinePicker

### Phase 4: 報酬・フィルタ
- CoinDisplay, CrystalDisplay (カウントアップアニメーション)
- StaminaBar (回復時間表示)
- FilterChips (期間・ジャンル・期限切れフィルタ)
- QuickAddButtons (FAB + 展開メニュー)

### Phase 5: アニメーション
- RewardAnimation (報酬獲得演出)
- LevelUpAnimation (レベルアップ演出)
- StaminaRecoveryEffect (スタミナ回復通知)

### Phase 8: 追加機能
- Calendar (月間カレンダー表示、date-fns統合)
- CalendarPage (カレンダービュー、選択日のタスク一覧)
- StatisticsPage (統計ダッシュボード、期間別集計)
- Chart (Recharts統合: BarChart, LineChart, PieChart, AreaChart)
- useTheme (ダークモード切り替えフック、localStorage永続化)
- ThemeProvider (テーマ管理プロバイダー)
- export-utils (CSV/JSONエクスポート機能)

### Phase 9: 品質向上
- Vitest (ユニットテスト: 73テスト作成)
- 動的インポート (next/dynamic: TaskDetailModal, RewardAnimation, Calendar)
- アクセシビリティ対応 (aria属性、キーボードナビゲーション)
- テストカバレッジ: reward-utils 100%
