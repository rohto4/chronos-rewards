# Chronos Rewards - システムアーキテクチャ & データフロー図
Version: 1.0  
Date: 2026-01-31

このドキュメントはMermaid記法を使用しています。VSCode（Markdown Preview Mermaid Support拡張機能）またはGitHubで自動的に図として表示されます。

---

## 1. システムアーキテクチャ図

### 1.1 全体構成

```mermaid
graph TB
    subgraph "Client Layer"
        PC[PC Browser<br/>Chrome/Edge/Firefox]
        Mobile[Mobile Browser<br/>Android PWA]
    end
    
    subgraph "Frontend - Vercel"
        NextJS[Next.js 14 App Router<br/>React 18]
        PWA[PWA Service Worker<br/>Offline Cache]
        UI[UI Components<br/>shadcn/ui + Tailwind]
        State[State Management<br/>Zustand]
    end
    
    subgraph "Backend - Supabase"
        Auth[Supabase Auth<br/>Google OAuth]
        DB[(PostgreSQL Database<br/>RLS Enabled)]
        Realtime[Realtime Subscription<br/>WebSocket]
        Storage[Storage<br/>Future: File Attachments]
    end
    
    PC -->|HTTPS| NextJS
    Mobile -->|HTTPS| NextJS
    NextJS --> PWA
    NextJS --> UI
    NextJS --> State
    
    State -->|API Calls| Auth
    State -->|CRUD Operations| DB
    State -->|Live Updates| Realtime
    
    Auth -.->|JWT Token| State
    DB -.->|Row Level Security| Auth
    Realtime -.->|Broadcast| DB
    
    style PC fill:#4A90E2
    style Mobile fill:#4A90E2
    style NextJS fill:#50C878
    style DB fill:#FF6B6B
    style Auth fill:#FFA500
    style Realtime fill:#9B59B6
```

---

### 1.2 レイヤー別詳細

```mermaid
graph LR
    subgraph "Presentation Layer"
        Pages[Pages<br/>app/page.tsx]
        Components[Components<br/>TaskCard, FilterChips]
        Hooks[Custom Hooks<br/>useTasks, useRewards]
    end
    
    subgraph "Business Logic Layer"
        RewardCalc[Reward Calculator<br/>coin/crystal logic]
        TaskLogic[Task Manager<br/>CRUD + hierarchy]
        StaminaLogic[Stamina System<br/>consume/recover]
    end
    
    subgraph "Data Access Layer"
        SupaClient[Supabase Client<br/>@supabase/supabase-js]
        RealtimeClient[Realtime Client<br/>WebSocket Subscribe]
        LocalCache[IndexedDB Cache<br/>Offline Storage]
    end
    
    Pages --> Components
    Components --> Hooks
    Hooks --> TaskLogic
    Hooks --> RewardCalc
    Hooks --> StaminaLogic
    
    TaskLogic --> SupaClient
    RewardCalc --> SupaClient
    StaminaLogic --> SupaClient
    
    SupaClient --> RealtimeClient
    SupaClient --> LocalCache
    
    style Pages fill:#E8F5E9
    style TaskLogic fill:#FFF9C4
    style SupaClient fill:#FFE0B2
```

---

## 2. データフロー図

### 2.1 タスク作成フロー

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Hook as useTasks Hook
    participant Supabase as Supabase Client
    participant DB as PostgreSQL
    participant Trigger as DB Trigger
    participant Profile as user_profiles

    User->>UI: "短期/Routine"ボタンをタップ
    UI->>UI: フォーム表示（初期値: 今週, 1h）
    User->>UI: タスク情報を入力
    UI->>Hook: createTask(taskData)
    
    Hook->>Hook: スタミナチェック (current >= cost)
    
    alt スタミナ不足
        Hook-->>UI: エラー表示
        UI-->>User: "スタミナが不足しています"
    else スタミナ十分
        Hook->>Supabase: INSERT INTO tasks
        Supabase->>DB: データ挿入
        
        activate Trigger
        DB->>Trigger: trigger_on_task_create()
        Trigger->>Trigger: 詳細度計算 (detail_level)
        Trigger->>Trigger: コイン報酬計算
        Trigger->>Profile: UPDATE total_coins
        Trigger->>Profile: UPDATE current_stamina (-10)
        Trigger->>DB: INSERT INTO reward_history
        Trigger->>DB: INSERT INTO stamina_history
        deactivate Trigger
        
        DB-->>Supabase: SUCCESS
        Supabase-->>Hook: タスクデータ返却
        Hook->>Hook: ローカルキャッシュ更新
        Hook-->>UI: 成功通知
        UI->>UI: アニメーション再生（コイン獲得）
        UI-->>User: タスク作成完了 + コイン表示
    end
    
    Note over Supabase,DB: Realtime経由で他デバイスにも配信
```

---

### 2.2 タスク完了フロー

```mermaid
sequenceDiagram
    participant User
    participant UI as TaskCard
    participant Hook as useTasks Hook
    participant Supabase as Supabase Client
    participant DB as PostgreSQL
    participant Trigger as DB Trigger
    participant Profile as user_profiles

    User->>UI: スワイプ右（完了）
    UI->>UI: スワイプアニメーション表示
    UI->>Hook: completeTask(taskId)
    
    Hook->>Supabase: UPDATE tasks SET is_completed = true
    Supabase->>DB: データ更新
    
    activate Trigger
    DB->>Trigger: trigger_on_task_complete()
    Trigger->>Trigger: 親タスクかチェック
    Trigger->>Trigger: クリスタル報酬計算
    Trigger->>Profile: UPDATE total_crystals
    Trigger->>DB: INSERT INTO reward_history
    
    alt 親タスクあり
        Trigger->>DB: UPDATE parent_task progress
    end
    deactivate Trigger
    
    DB-->>Supabase: SUCCESS
    Supabase-->>Hook: 更新データ返却
    Hook->>Hook: ローカルキャッシュ更新
    Hook-->>UI: 成功通知
    UI->>UI: アニメーション再生（クリスタル獲得）
    UI-->>User: タスク完了 + クリスタル表示
    
    Note over Supabase,DB: Realtime経由で他デバイスにも配信
```

---

### 2.3 リアルタイム同期フロー（PC ↔ Mobile）

```mermaid
sequenceDiagram
    participant PC as PC Browser
    participant Mobile as Mobile PWA
    participant Realtime as Supabase Realtime
    participant DB as PostgreSQL

    Note over PC,Mobile: 両デバイスがログイン済み
    
    PC->>Realtime: WebSocket接続 + Subscribe(tasks)
    Mobile->>Realtime: WebSocket接続 + Subscribe(tasks)
    
    PC->>PC: タスクを作成
    PC->>DB: INSERT INTO tasks
    DB->>Realtime: 変更通知（INSERT event）
    
    Realtime->>Mobile: Broadcast: New Task Created
    Mobile->>Mobile: ローカルキャッシュ更新
    Mobile->>Mobile: UI再レンダリング
    
    Note over Mobile: PCで作成したタスクが即座に表示される
    
    Mobile->>Mobile: タスクを完了
    Mobile->>DB: UPDATE tasks SET is_completed = true
    DB->>Realtime: 変更通知（UPDATE event）
    
    Realtime->>PC: Broadcast: Task Completed
    PC->>PC: ローカルキャッシュ更新
    PC->>PC: UI再レンダリング
    
    Note over PC: Mobileで完了したタスクが即座に反映される
```

---

### 2.4 オフライン対応フロー

```mermaid
flowchart TD
    Start([ユーザーがタスク作成])
    CheckOnline{オンライン?}
    
    Online[Supabaseに直接送信]
    Success[成功レスポンス]
    UpdateUI[UI即座に更新]
    
    Offline[IndexedDBにキュー登録]
    ShowPending[UI更新（保留中マーク）]
    WaitOnline[オンライン復帰を待機]
    
    CheckOnline2{オンライン復帰?}
    SyncQueue[キューから取り出し]
    SendToSupabase[Supabaseに送信]
    
    ConflictCheck{競合チェック}
    Merge[統合処理]
    PCPriority[PC優先で解決]
    
    FinalSync[最終同期]
    RemoveQueue[キューから削除]
    UpdateSuccess[UI更新（完了マーク）]
    
    Start --> CheckOnline
    
    CheckOnline -->|Yes| Online
    Online --> Success
    Success --> UpdateUI
    
    CheckOnline -->|No| Offline
    Offline --> ShowPending
    ShowPending --> WaitOnline
    
    WaitOnline --> CheckOnline2
    CheckOnline2 -->|No| WaitOnline
    CheckOnline2 -->|Yes| SyncQueue
    
    SyncQueue --> SendToSupabase
    SendToSupabase --> ConflictCheck
    
    ConflictCheck -->|競合なし| FinalSync
    ConflictCheck -->|競合あり| Merge
    
    Merge --> PCPriority
    PCPriority --> FinalSync
    
    FinalSync --> RemoveQueue
    RemoveQueue --> UpdateSuccess
    
    style Start fill:#4CAF50
    style Offline fill:#FFA726
    style ConflictCheck fill:#EF5350
    style UpdateSuccess fill:#66BB6A
```

---

### 2.5 報酬計算フロー

```mermaid
flowchart TD
    TaskCreate[タスク作成]
    CalcDetail[詳細度計算<br/>calculate_detail_level]
    
    CheckDesc{description<br/>10文字以上?}
    CheckBenefit{benefits<br/>10文字以上?}
    CheckChecklist{checklist<br/>3個以上?}
    CheckHours{estimated_hours<br/>10h以上?}
    
    DetailLevel[detail_level決定<br/>1-5]
    
    CalcCoin[コイン報酬計算<br/>calculate_coin_reward]
    BaseCoin[基本: 10コイン]
    
    MultDetail[詳細度倍率<br/>1.0 + level-1 × 0.25]
    MultPrereq{前提条件あり?}
    MultBenefit{メリットあり?}
    
    FinalCoin[最終コイン = FLOOR基本 × 倍率]
    
    ConsumeStamina[スタミナ消費<br/>基本10 + 追加]
    RewardUser[user_profilesに反映]
    LogHistory[reward_historyに記録]
    
    TaskCreate --> CalcDetail
    CalcDetail --> CheckDesc
    CheckDesc -->|Yes +1| CheckBenefit
    CheckDesc -->|No| CheckBenefit
    CheckBenefit -->|Yes +1| CheckChecklist
    CheckBenefit -->|No| CheckChecklist
    CheckChecklist -->|Yes +1| CheckHours
    CheckChecklist -->|No| CheckHours
    CheckHours -->|Yes +1| DetailLevel
    CheckHours -->|No| DetailLevel
    
    DetailLevel --> CalcCoin
    CalcCoin --> BaseCoin
    BaseCoin --> MultDetail
    MultDetail --> MultPrereq
    MultPrereq -->|Yes ×1.2| MultBenefit
    MultPrereq -->|No| MultBenefit
    MultBenefit -->|Yes ×1.2| FinalCoin
    MultBenefit -->|No| FinalCoin
    
    FinalCoin --> ConsumeStamina
    ConsumeStamina --> RewardUser
    RewardUser --> LogHistory
    
    style TaskCreate fill:#42A5F5
    style DetailLevel fill:#FFA726
    style FinalCoin fill:#66BB6A
    style LogHistory fill:#AB47BC
```

---

### 2.6 スタミナ回復フロー

```mermaid
flowchart TD
    UserLogin[ユーザーログイン/画面表示]
    CheckRecovery[recover_stamina実行]
    
    GetProfile[user_profiles取得<br/>last_stamina_recovery]
    CalcElapsed[経過時間計算<br/>now - last_recovery]
    
    CalcAmount[回復量 = FLOOR経過時間h × 10]
    
    CheckAmount{回復量 > 0?}
    
    UpdateStamina[current_stamina更新<br/>MIN現在 + 回復, max_stamina]
    UpdateTime[last_stamina_recovery<br/>= now]
    
    ReturnCurrent[現在のスタミナ返却]
    DisplayUI[UIに反映]
    
    UserLogin --> CheckRecovery
    CheckRecovery --> GetProfile
    GetProfile --> CalcElapsed
    CalcElapsed --> CalcAmount
    CalcAmount --> CheckAmount
    
    CheckAmount -->|Yes| UpdateStamina
    CheckAmount -->|No| ReturnCurrent
    
    UpdateStamina --> UpdateTime
    UpdateTime --> ReturnCurrent
    ReturnCurrent --> DisplayUI
    
    style UserLogin fill:#4CAF50
    style CalcAmount fill:#FFA726
    style UpdateStamina fill:#66BB6A
    style DisplayUI fill:#42A5F5
```

---

## 3. 画面遷移図

```mermaid
stateDiagram-v2
    [*] --> Login: アプリ起動
    
    Login --> Dashboard: Google認証成功
    
    state Dashboard {
        [*] --> TaskList
        TaskList --> FilterView: フィルタ選択
        FilterView --> TaskList: 表示更新
        TaskList --> TaskDetail: タスクタップ
        TaskDetail --> TaskList: 戻る
        TaskList --> QuickAdd: ＋ボタンタップ
        QuickAdd --> TaskList: 作成完了
    }
    
    Dashboard --> Stats: 統計タブ
    Stats --> Dashboard: 戻る
    
    Dashboard --> Settings: 設定
    Settings --> Dashboard: 戻る
    
    Dashboard --> [*]: ログアウト
    
    note right of Login
        Google OAuth
        初回: user_profiles自動作成
    end note
    
    note right of Dashboard
        メイン画面
        - タスク一覧
        - フィルタチップ
        - デュアルクイック登録
    end note
    
    note right of Stats
        統計画面
        - 完了数グラフ
        - 時間集計
        - ジャンル別分析
    end note
```

---

## 4. コンポーネント構成図

```mermaid
graph TD
    subgraph "app/layout.tsx"
        RootLayout[Root Layout<br/>認証チェック]
    end
    
    subgraph "app/page.tsx - Dashboard"
        Dashboard[Dashboard Page]
        Header[Header<br/>コイン/クリスタル/スタミナ表示]
        FilterChips[FilterChips<br/>期間フィルタ]
        TaskList[TaskList<br/>タスク一覧表示]
        QuickAdd[QuickAddButtons<br/>短期/長期ボタン]
    end
    
    subgraph "components/tasks"
        TaskCard[TaskCard<br/>スワイプ対応]
        TaskForm[TaskForm<br/>作成/編集フォーム]
        TaskDetail[TaskDetail<br/>詳細表示/編集]
        ChecklistItem[ChecklistItem<br/>前提条件チェック]
    end
    
    subgraph "components/rewards"
        CoinDisplay[CoinDisplay<br/>コイン表示]
        CrystalDisplay[CrystalDisplay<br/>クリスタル表示]
        StaminaBar[StaminaBar<br/>スタミナゲージ]
        RewardAnimation[RewardAnimation<br/>獲得演出]
    end
    
    subgraph "lib/hooks"
        useTasks[useTasks<br/>タスクCRUD]
        useRewards[useRewards<br/>報酬管理]
        useStamina[useStamina<br/>スタミナ管理]
        useRealtime[useRealtime<br/>リアルタイム同期]
    end
    
    RootLayout --> Dashboard
    Dashboard --> Header
    Dashboard --> FilterChips
    Dashboard --> TaskList
    Dashboard --> QuickAdd
    
    Header --> CoinDisplay
    Header --> CrystalDisplay
    Header --> StaminaBar
    
    TaskList --> TaskCard
    TaskCard --> TaskDetail
    QuickAdd --> TaskForm
    TaskForm --> ChecklistItem
    
    TaskCard --> useTasks
    TaskForm --> useTasks
    TaskDetail --> useTasks
    
    CoinDisplay --> useRewards
    CrystalDisplay --> useRewards
    StaminaBar --> useStamina
    
    useTasks --> useRealtime
    useRewards --> useRealtime
    
    style Dashboard fill:#E3F2FD
    style useTasks fill:#FFF9C4
    style useRealtime fill:#F3E5F5
```

---

## 5. データベーストリガー処理フロー

```mermaid
flowchart TD
    subgraph "タスク作成トリガー"
        InsertTask[INSERT INTO tasks]
        TriggerCreate[trigger_on_task_create]
        CalcDetail1[詳細度計算]
        ConsumeStam1[スタミナ消費]
        CalcCoin[コイン計算]
        UpdateCoins[total_coins更新]
        InsertReward1[reward_history挿入]
    end
    
    subgraph "タスク完了トリガー"
        UpdateComplete[UPDATE is_completed = true]
        TriggerComplete[trigger_on_task_complete]
        CheckParent[親タスクチェック]
        CalcCrystal[クリスタル計算]
        UpdateCrystals[total_crystals更新]
        InsertReward2[reward_history挿入]
        UpdateParentProgress[親progress更新]
    end
    
    subgraph "タスク編集トリガー"
        UpdateTask[UPDATE tasks]
        TriggerEdit[trigger_on_task_edit]
        CalcDetail2[詳細度再計算]
        CheckImprove{詳細度向上?}
        ConsumeStam2[スタミナ消費]
        BonusCoin[追加コイン]
        InsertReward3[reward_history挿入]
    end
    
    InsertTask --> TriggerCreate
    TriggerCreate --> CalcDetail1
    CalcDetail1 --> ConsumeStam1
    ConsumeStam1 --> CalcCoin
    CalcCoin --> UpdateCoins
    UpdateCoins --> InsertReward1
    
    UpdateComplete --> TriggerComplete
    TriggerComplete --> CheckParent
    CheckParent --> CalcCrystal
    CalcCrystal --> UpdateCrystals
    UpdateCrystals --> InsertReward2
    InsertReward2 --> UpdateParentProgress
    
    UpdateTask --> TriggerEdit
    TriggerEdit --> CalcDetail2
    CalcDetail2 --> CheckImprove
    CheckImprove -->|Yes| ConsumeStam2
    CheckImprove -->|No| End1[終了]
    ConsumeStam2 --> BonusCoin
    BonusCoin --> InsertReward3
    
    style TriggerCreate fill:#66BB6A
    style TriggerComplete fill:#42A5F5
    style TriggerEdit fill:#FFA726
```

---

## 6. PWA オフライン戦略

```mermaid
flowchart TD
    subgraph "Service Worker"
        SW[Service Worker<br/>next-pwa]
        CacheStatic[Static Cache<br/>HTML/CSS/JS/Images]
        CacheAPI[API Cache<br/>GET requests only]
    end
    
    subgraph "IndexedDB"
        TaskQueue[Task Queue<br/>未送信CRUD操作]
        OfflineData[Offline Data<br/>ローカルコピー]
    end
    
    subgraph "Online Strategy"
        NetworkFirst[Network First<br/>API Calls]
        CacheFirst[Cache First<br/>Static Assets]
    end
    
    subgraph "Offline Strategy"
        QueueWrite[WRITE操作をキューに保存]
        ServeCache[キャッシュから読み込み]
    end
    
    UserRequest[ユーザーリクエスト]
    CheckNetwork{ネットワーク<br/>接続?}
    
    UserRequest --> SW
    SW --> CheckNetwork
    
    CheckNetwork -->|Online| NetworkFirst
    CheckNetwork -->|Offline| ServeCache
    
    NetworkFirst --> CacheAPI
    CacheFirst --> CacheStatic
    
    ServeCache --> OfflineData
    QueueWrite --> TaskQueue
    
    OnlineRestore[オンライン復帰]
    ProcessQueue[キュー処理]
    Sync[同期完了]
    
    TaskQueue --> OnlineRestore
    OnlineRestore --> ProcessQueue
    ProcessQueue --> Sync
    
    style SW fill:#4CAF50
    style TaskQueue fill:#FFA726
    style Sync fill:#66BB6A
```

---

## 7. セキュリティフロー（RLS）

```mermaid
flowchart TD
    ClientRequest[クライアントリクエスト<br/>SELECT * FROM tasks]
    
    SupabaseAuth[Supabase Auth<br/>JWT検証]
    
    CheckAuth{認証済み?}
    
    GetUID[auth.uid取得]
    
    RLSCheck[RLS Policy適用<br/>WHERE user_id = auth.uid]
    
    DBQuery[PostgreSQL実行<br/>フィルタ済みクエリ]
    
    ReturnData[ユーザーデータのみ返却]
    
    Unauthorized[401 Unauthorized]
    
    ClientRequest --> SupabaseAuth
    SupabaseAuth --> CheckAuth
    
    CheckAuth -->|No| Unauthorized
    CheckAuth -->|Yes| GetUID
    
    GetUID --> RLSCheck
    RLSCheck --> DBQuery
    DBQuery --> ReturnData
    
    style SupabaseAuth fill:#FFA726
    style RLSCheck fill:#EF5350
    style ReturnData fill:#66BB6A
    style Unauthorized fill:#F44336
```

---

## 8. 主要処理フロー詳細

### 8.1 アプリ起動時の初期化フロー

```mermaid
flowchart TD
    Start([アプリ起動])
    LoadSW[Service Worker読み込み]
    CheckAuth{認証状態<br/>チェック}
    
    NoAuth[ログイン画面表示]
    GoogleAuth[Google OAuth実行]
    CreateProfile{user_profiles<br/>存在?}
    
    InitProfile[user_profiles作成<br/>trigger実行]
    
    LoadProfile[user_profiles取得]
    RecoverStamina[スタミナ回復処理<br/>recover_stamina]
    
    SubscribeRealtime[Realtime購読開始<br/>tasks, user_profiles]
    
    LoadTasks[タスク一覧取得<br/>deleted_at IS NULL]
    LoadGenres[ジャンル一覧取得<br/>usage_count DESC]
    
    CacheData[IndexedDBにキャッシュ]
    
    RenderUI[ダッシュボード表示]
    
    Ready([アプリ準備完了])
    
    Start --> LoadSW
    LoadSW --> CheckAuth
    
    CheckAuth -->|未認証| NoAuth
    NoAuth --> GoogleAuth
    GoogleAuth --> CreateProfile
    
    CreateProfile -->|No| InitProfile
    CreateProfile -->|Yes| LoadProfile
    InitProfile --> LoadProfile
    
    CheckAuth -->|認証済み| LoadProfile
    
    LoadProfile --> RecoverStamina
    RecoverStamina --> SubscribeRealtime
    
    SubscribeRealtime --> LoadTasks
    LoadTasks --> LoadGenres
    LoadGenres --> CacheData
    
    CacheData --> RenderUI
    RenderUI --> Ready
    
    style Start fill:#4CAF50
    style GoogleAuth fill:#FFA726
    style Ready fill:#66BB6A
```

---

### 8.2 フィルタリング処理フロー

```mermaid
flowchart TD
    UserSelect[ユーザーがフィルタチップ選択]
    
    UpdateState[State更新<br/>selectedFilters配列]
    
    CalcDateRange[日付範囲計算<br/>now → deadline範囲]
    
    Examples["例：<br/>今週 → now ～ +7days<br/>3ヶ月 → now ～ +90days"]
    
    FilterTasks[タスクフィルタリング]
    
    CheckDeadline{期限が<br/>範囲内?}
    CheckOverdue{期限切れ<br/>表示ON?}
    CheckGenre{ジャンル<br/>一致?}
    
    IncludeTask[タスク表示対象]
    ExcludeTask[タスク非表示]
    
    SortByDeadline[期限が近い順ソート]
    
    RenderList[TaskList再レンダリング]
    
    UserSelect --> UpdateState
    UpdateState --> CalcDateRange
    CalcDateRange --> Examples
    Examples --> FilterTasks
    
    FilterTasks --> CheckDeadline
    
    CheckDeadline -->|Yes| CheckGenre
    CheckDeadline -->|No 期限切れ| CheckOverdue
    
    CheckOverdue -->|ON| CheckGenre
    CheckOverdue -->|OFF| ExcludeTask
    
    CheckGenre -->|一致 or 未選択| IncludeTask
    CheckGenre -->|不一致| ExcludeTask
    
    IncludeTask --> SortByDeadline
    SortByDeadline --> RenderList
    
    style UserSelect fill:#42A5F5
    style CalcDateRange fill:#FFA726
    style RenderList fill:#66BB6A
```

---

### 8.3 ジャンル管理フロー

```mermaid
flowchart TD
    UserInput[ユーザーがジャンル入力]
    
    CheckExisting{既存ジャンル<br/>検索}
    
    ShowDropdown[プルダウン表示<br/>usage_count順]
    
    UserSelect{選択 or<br/>新規入力?}
    
    SelectExisting[既存ジャンル選択<br/>genre_id設定]
    
    CreateNew[新規ジャンル作成]
    
    GenColor[ランダム色生成<br/>またはユーザー選択]
    
    InsertGenre[INSERT INTO task_genres]
    
    AttachToTask[タスクにgenre_id関連付け]
    
    TriggerUsage[trigger_update_genre_usage<br/>usage_count++]
    
    UpdateDropdown[プルダウンリスト更新]
    
    Done([完了])
    
    UserInput --> CheckExisting
    
    CheckExisting -->|見つかった| ShowDropdown
    CheckExisting -->|見つからない| CreateNew
    
    ShowDropdown --> UserSelect
    
    UserSelect -->|選択| SelectExisting
    UserSelect -->|新規| CreateNew
    
    SelectExisting --> AttachToTask
    
    CreateNew --> GenColor
    GenColor --> InsertGenre
    InsertGenre --> AttachToTask
    
    AttachToTask --> TriggerUsage
    TriggerUsage --> UpdateDropdown
    UpdateDropdown --> Done
    
    style UserInput fill:#42A5F5
    style CreateNew fill:#FFA726
    style Done fill:#66BB6A
```

---

### 8.4 親子タスク作成・管理フロー

```mermaid
flowchart TD
    ViewParent[親タスク表示]
    
    UserAddChild[「子タスク追加」ボタン]
    
    OpenForm[TaskForm表示<br/>parent_task_id設定済み]
    
    InputChild[子タスク情報入力]
    
    CreateChild[INSERT INTO tasks<br/>parent_task_id指定]
    
    TriggerCreate[trigger_on_task_create<br/>スタミナ消費 + コイン獲得]
    
    UpdateParent[親タスクのUI更新<br/>子タスク一覧表示]
    
    CompleteChild{子タスク完了?}
    
    TriggerComplete[trigger_on_task_complete<br/>クリスタル獲得]
    
    CalcProgress[calculate_task_progress<br/>完了率計算]
    
    UpdateProgress[親タスクprogress更新<br/>例：3/5完了 = 60%]
    
    CheckAllComplete{全子タスク<br/>完了?}
    
    ShowProgress[進捗バー表示<br/>60%]
    
    SuggestComplete[親タスク完了<br/>提案表示]
    
    UserCompleteParent{親タスク<br/>完了実行?}
    
    ParentBonus[親タスクボーナス<br/>クリスタル×3]
    
    Done([完了])
    
    ViewParent --> UserAddChild
    UserAddChild --> OpenForm
    OpenForm --> InputChild
    InputChild --> CreateChild
    CreateChild --> TriggerCreate
    TriggerCreate --> UpdateParent
    
    UpdateParent --> CompleteChild
    
    CompleteChild -->|No| Done
    CompleteChild -->|Yes| TriggerComplete
    
    TriggerComplete --> CalcProgress
    CalcProgress --> UpdateProgress
    UpdateProgress --> CheckAllComplete
    
    CheckAllComplete -->|No| ShowProgress
    CheckAllComplete -->|Yes| SuggestComplete
    
    ShowProgress --> Done
    
    SuggestComplete --> UserCompleteParent
    
    UserCompleteParent -->|Yes| ParentBonus
    UserCompleteParent -->|No| Done
    
    ParentBonus --> Done
    
    style ViewParent fill:#42A5F5
    style CalcProgress fill:#FFA726
    style ParentBonus fill:#66BB6A
```

---

### 8.5 スワイプ操作処理フロー

```mermaid
flowchart TD
    TouchStart[タッチ開始<br/>onTouchStart]
    
    RecordStart[開始座標記録<br/>startX, startY]
    
    TouchMove[タッチ移動<br/>onTouchMove]
    
    CalcDelta[移動量計算<br/>deltaX = currentX - startX]
    
    ShowHint{移動量 > 50px?}
    
    RightSwipe[右スワイプヒント<br/>「完了」アイコン表示]
    
    LeftSwipe[左スワイプヒント<br/>「削除」アイコン表示]
    
    NoHint[ヒント非表示]
    
    TouchEnd[タッチ終了<br/>onTouchEnd]
    
    CheckThreshold{移動量 > 100px?}
    
    ExecuteRight{deltaX > 100?}
    ExecuteLeft{deltaX < -100?}
    
    CompleteTask[タスク完了処理<br/>completeTask]
    DeleteTask[タスク削除処理<br/>deleteTask]
    
    Animate[スワイプアニメーション]
    
    ResetPosition[カード位置リセット]
    
    Done([完了])
    
    TouchStart --> RecordStart
    RecordStart --> TouchMove
    
    TouchMove --> CalcDelta
    CalcDelta --> ShowHint
    
    ShowHint -->|Yes deltaX > 50| RightSwipe
    ShowHint -->|Yes deltaX < -50| LeftSwipe
    ShowHint -->|No| NoHint
    
    RightSwipe --> TouchEnd
    LeftSwipe --> TouchEnd
    NoHint --> TouchEnd
    
    TouchEnd --> CheckThreshold
    
    CheckThreshold -->|No| ResetPosition
    CheckThreshold -->|Yes| ExecuteRight
    
    ExecuteRight -->|Yes| CompleteTask
    ExecuteRight -->|No| ExecuteLeft
    
    ExecuteLeft -->|Yes| DeleteTask
    ExecuteLeft -->|No| ResetPosition
    
    CompleteTask --> Animate
    DeleteTask --> Animate
    
    Animate --> Done
    ResetPosition --> Done
    
    style TouchStart fill:#42A5F5
    style CompleteTask fill:#66BB6A
    style DeleteTask fill:#EF5350
```

---

### 8.6 報酬アニメーション処理フロー

```mermaid
flowchart TD
    TriggerReward[報酬獲得イベント]
    
    CheckType{報酬タイプ?}
    
    CoinAnim[コインアニメーション]
    CrystalAnim[クリスタルアニメーション]
    
    GenParticles[パーティクル生成<br/>20-30個]
    
    SetInitPos[初期位置設定<br/>タスクカード中央]
    
    SetTarget[目標位置設定<br/>ヘッダーのアイコン]
    
    CalcPath[ベジェ曲線パス計算<br/>ランダム制御点]
    
    AnimateMotion[Framer Motion実行<br/>duration: 0.8s]
    
    PlaySound[効果音再生<br/>coin.mp3 / crystal.mp3]
    
    CountUp[数値カウントアップ<br/>アニメーション]
    
    UpdateDisplay[ヘッダー表示更新<br/>total_coins / total_crystals]
    
    Cleanup[パーティクル削除]
    
    Done([完了])
    
    TriggerReward --> CheckType
    
    CheckType -->|Coin| CoinAnim
    CheckType -->|Crystal| CrystalAnim
    
    CoinAnim --> GenParticles
    CrystalAnim --> GenParticles
    
    GenParticles --> SetInitPos
    SetInitPos --> SetTarget
    SetTarget --> CalcPath
    
    CalcPath --> AnimateMotion
    AnimateMotion --> PlaySound
    
    PlaySound --> CountUp
    CountUp --> UpdateDisplay
    UpdateDisplay --> Cleanup
    
    Cleanup --> Done
    
    style TriggerReward fill:#42A5F5
    style AnimateMotion fill:#FFA726
    style Done fill:#66BB6A
```

---

### 8.7 統計画面データ集計フロー

```mermaid
flowchart TD
    OpenStats[統計画面を開く]
    
    SelectPeriod[期間選択<br/>今日/今週/今月/全期間]
    
    CalcRange[日付範囲計算]
    
    QueryTasks[tasksテーブルクエリ<br/>WHERE created_at/completed_at IN range]
    
    QueryRewards[reward_historyクエリ<br/>WHERE created_at IN range]
    
    QueryStamina[stamina_historyクエリ<br/>WHERE created_at IN range]
    
    AggregateData[データ集計処理]
    
    CalcCompleted[完了タスク数<br/>COUNT WHERE is_completed = true]
    
    CalcHours[消化時間<br/>SUM estimated_hours]
    
    CalcByGenre[ジャンル別集計<br/>GROUP BY genre_id]
    
    CalcRewards[報酬集計<br/>SUM amount GROUP BY reward_type]
    
    PrepareChartData[グラフデータ整形<br/>日別/週別配列]
    
    RenderCharts[Chart.js/Recharts描画]
    
    DisplayStats[統計情報表示]
    
    Done([完了])
    
    OpenStats --> SelectPeriod
    SelectPeriod --> CalcRange
    
    CalcRange --> QueryTasks
    CalcRange --> QueryRewards
    CalcRange --> QueryStamina
    
    QueryTasks --> AggregateData
    QueryRewards --> AggregateData
    QueryStamina --> AggregateData
    
    AggregateData --> CalcCompleted
    AggregateData --> CalcHours
    AggregateData --> CalcByGenre
    AggregateData --> CalcRewards
    
    CalcCompleted --> PrepareChartData
    CalcHours --> PrepareChartData
    CalcByGenre --> PrepareChartData
    CalcRewards --> PrepareChartData
    
    PrepareChartData --> RenderCharts
    RenderCharts --> DisplayStats
    
    DisplayStats --> Done
    
    style OpenStats fill:#42A5F5
    style AggregateData fill:#FFA726
    style RenderCharts fill:#66BB6A
```

---

### 8.8 エラーハンドリングフロー

```mermaid
flowchart TD
    Operation[ユーザー操作]
    
    TryCatch[try-catch実行]
    
    CheckError{エラー発生?}
    
    Success[正常処理]
    
    ErrorType{エラー種別?}
    
    StaminaError[スタミナ不足エラー]
    NetworkError[ネットワークエラー]
    AuthError[認証エラー]
    ValidationError[バリデーションエラー]
    DBError[データベースエラー]
    UnknownError[その他のエラー]
    
    ShowStaminaToast[Toast表示<br/>「スタミナが不足しています」]
    ShowNetworkToast[Toast表示<br/>「オフライン：後で同期されます」]
    RedirectLogin[ログイン画面へリダイレクト]
    ShowValidationMsg[フォームエラー表示<br/>該当フィールドハイライト]
    ShowDBToast[Toast表示<br/>「エラーが発生しました」]
    ShowGenericToast[Toast表示<br/>「予期しないエラー」]
    
    LogError[エラーログ記録<br/>Sentry/Console]
    
    QueueRetry{リトライ可能?}
    
    AddToQueue[オフラインキューに追加]
    
    RollbackUI[UI状態をロールバック]
    
    Done([完了])
    
    Operation --> TryCatch
    TryCatch --> CheckError
    
    CheckError -->|No| Success
    CheckError -->|Yes| ErrorType
    
    Success --> Done
    
    ErrorType -->|スタミナ不足| StaminaError
    ErrorType -->|ネットワーク| NetworkError
    ErrorType -->|認証| AuthError
    ErrorType -->|バリデーション| ValidationError
    ErrorType -->|DB| DBError
    ErrorType -->|その他| UnknownError
    
    StaminaError --> ShowStaminaToast
    NetworkError --> ShowNetworkToast
    AuthError --> RedirectLogin
    ValidationError --> ShowValidationMsg
    DBError --> ShowDBToast
    UnknownError --> ShowGenericToast
    
    ShowStaminaToast --> LogError
    ShowNetworkToast --> QueueRetry
    RedirectLogin --> LogError
    ShowValidationMsg --> Done
    ShowDBToast --> LogError
    ShowGenericToast --> LogError
    
    QueueRetry -->|Yes| AddToQueue
    QueueRetry -->|No| LogError
    
    AddToQueue --> Done
    
    LogError --> RollbackUI
    RollbackUI --> Done
    
    style Operation fill:#42A5F5
    style ErrorType fill:#EF5350
    style Done fill:#66BB6A
```

---

## 8. 処理フロー図（ユースケース別）

### 8.1 アプリ起動〜ダッシュボード表示

```mermaid
flowchart TD
    Start([アプリ起動])
    CheckAuth{認証状態<br/>確認}
    
    LoginPage[ログイン画面表示]
    GoogleAuth[Google OAuth実行]
    CreateProfile{user_profiles<br/>存在?}
    
    AutoCreate[トリガーで自動作成<br/>handle_new_user]
    
    RecoverStamina[スタミナ回復処理<br/>recover_stamina]
    
    FetchTasks[タスク一覧取得<br/>SELECT tasks]
    FetchProfile[プロフィール取得<br/>SELECT user_profiles]
    
    SubscribeRealtime[Realtime購読開始<br/>WebSocket接続]
    
    RenderDashboard[ダッシュボード表示]
    
    LoadCache{キャッシュ<br/>あり?}
    ShowCache[キャッシュから即座に表示]
    ShowLoading[ローディング表示]
    
    Start --> CheckAuth
    
    CheckAuth -->|未認証| LoginPage
    CheckAuth -->|認証済み| LoadCache
    
    LoginPage --> GoogleAuth
    GoogleAuth --> CreateProfile
    
    CreateProfile -->|No| AutoCreate
    CreateProfile -->|Yes| RecoverStamina
    AutoCreate --> RecoverStamina
    
    LoadCache -->|Yes| ShowCache
    LoadCache -->|No| ShowLoading
    
    ShowCache --> RecoverStamina
    ShowLoading --> RecoverStamina
    
    RecoverStamina --> FetchProfile
    FetchProfile --> FetchTasks
    FetchTasks --> SubscribeRealtime
    SubscribeRealtime --> RenderDashboard
    
    style Start fill:#4CAF50
    style GoogleAuth fill:#FFA726
    style RenderDashboard fill:#66BB6A
```

---

### 8.2 フィルタリング処理

```mermaid
flowchart TD
    UserClick[ユーザーがフィルタチップクリック]
    
    GetCurrentFilters[現在のフィルタ状態取得]
    
    ToggleFilter{同じフィルタ<br/>再クリック?}
    
    RemoveFilter[フィルタ削除]
    AddFilter[フィルタ追加]
    
    CalcDateRange[日付範囲計算<br/>今日/今週/3ヶ月等]
    
    FilterTasks[タスクをフィルタリング<br/>WHERE deadline BETWEEN]
    
    CheckOverdue{期限切れ<br/>表示ON?}
    
    IncludeOverdue[期限切れも含める]
    ExcludeOverdue[期限切れ除外]
    
    SortByDeadline[期限が近い順にソート<br/>ORDER BY deadline ASC]
    
    UpdateUI[UI再レンダリング]
    
    UserClick --> GetCurrentFilters
    GetCurrentFilters --> ToggleFilter
    
    ToggleFilter -->|Yes| RemoveFilter
    ToggleFilter -->|No| AddFilter
    
    RemoveFilter --> CalcDateRange
    AddFilter --> CalcDateRange
    
    CalcDateRange --> FilterTasks
    FilterTasks --> CheckOverdue
    
    CheckOverdue -->|Yes| IncludeOverdue
    CheckOverdue -->|No| ExcludeOverdue
    
    IncludeOverdue --> SortByDeadline
    ExcludeOverdue --> SortByDeadline
    
    SortByDeadline --> UpdateUI
    
    style UserClick fill:#42A5F5
    style CalcDateRange fill:#FFA726
    style UpdateUI fill:#66BB6A
```

---

### 8.3 デュアルクイック登録処理

```mermaid
flowchart TD
    UserClick[ユーザーが＋ボタンクリック]
    
    CheckButton{どちらの<br/>ボタン?}
    
    ShortTerm[短期/Routine<br/>初期値設定]
    LongTerm[長期/Project<br/>初期値設定]
    
    SetDeadlineShort[時限: 今週<br/>7日後の日付]
    SetHoursShort[重さ: 1h]
    
    SetDeadlineLong[時限: 3ヶ月<br/>90日後の日付]
    SetHoursLong[重さ: 10h]
    
    ShowForm[フォーム表示<br/>初期値入力済み]
    
    UserInput[ユーザーが入力<br/>タスク名/ジャンル等]
    
    CheckGenre{ジャンル入力<br/>開始?}
    
    FetchGenres[既存ジャンル取得<br/>SELECT task_genres<br/>ORDER BY usage_count]
    ShowDropdown[プルダウン表示]
    
    SelectOrCreate{既存選択 or<br/>新規入力?}
    
    SelectExisting[既存ジャンル選択]
    CreateNew[新規ジャンル作成<br/>INSERT task_genres]
    
    Validate{入力検証<br/>タスク名必須}
    
    ShowError[エラー表示]
    
    CheckStamina{スタミナ<br/>十分?}
    
    CalculateCost[必要スタミナ計算<br/>基本10 + 詳細度]
    
    CreateTask[タスク作成処理<br/>→ Section 2.1参照]
    
    CloseForm[フォーム閉じる]
    ShowSuccess[成功通知 + アニメーション]
    
    UserClick --> CheckButton
    
    CheckButton -->|短期| ShortTerm
    CheckButton -->|長期| LongTerm
    
    ShortTerm --> SetDeadlineShort
    SetDeadlineShort --> SetHoursShort
    SetHoursShort --> ShowForm
    
    LongTerm --> SetDeadlineLong
    SetDeadlineLong --> SetHoursLong
    SetHoursLong --> ShowForm
    
    ShowForm --> UserInput
    
    UserInput --> CheckGenre
    
    CheckGenre -->|Yes| FetchGenres
    CheckGenre -->|No| Validate
    
    FetchGenres --> ShowDropdown
    ShowDropdown --> SelectOrCreate
    
    SelectOrCreate -->|既存| SelectExisting
    SelectOrCreate -->|新規| CreateNew
    
    SelectExisting --> Validate
    CreateNew --> Validate
    
    Validate -->|NG| ShowError
    ShowError --> UserInput
    
    Validate -->|OK| CalculateCost
    CalculateCost --> CheckStamina
    
    CheckStamina -->|不足| ShowError
    CheckStamina -->|十分| CreateTask
    
    CreateTask --> CloseForm
    CloseForm --> ShowSuccess
    
    style UserClick fill:#42A5F5
    style CheckStamina fill:#EF5350
    style ShowSuccess fill:#66BB6A
```

---

### 8.4 親子タスク作成処理

```mermaid
flowchart TD
    UserAction[ユーザーが親タスクから<br/>子タスク作成を選択]
    
    GetParentInfo[親タスク情報取得<br/>parent_task_id設定]
    
    ShowForm[子タスクフォーム表示]
    
    InheritGenre{ジャンル<br/>継承?}
    
    CopyGenre[親のジャンルを初期値に]
    EmptyGenre[空欄]
    
    SuggestDeadline[親の期限より前を推奨<br/>バリデーション]
    
    UserInput[ユーザー入力]
    
    ValidateDeadline{期限が親より<br/>未来?}
    
    ShowWarning[警告表示<br/>続行は可能]
    
    CreateChildTask[子タスク作成<br/>parent_task_id設定]
    
    UpdateParentProgress[親タスク進捗更新<br/>calculate_task_progress]
    
    CountChildren[子タスク数カウント]
    CountCompleted[完了子タスク数カウント]
    
    CalcProgress[進捗率 = <br/>完了数 / 総数 × 100]
    
    UpdateDB[親タスクUPDATE<br/>completion_progress]
    
    ShowSuccess[成功通知]
    RefreshUI[UI更新<br/>親子関係表示]
    
    UserAction --> GetParentInfo
    GetParentInfo --> ShowForm
    
    ShowForm --> InheritGenre
    
    InheritGenre -->|Yes| CopyGenre
    InheritGenre -->|No| EmptyGenre
    
    CopyGenre --> SuggestDeadline
    EmptyGenre --> SuggestDeadline
    
    SuggestDeadline --> UserInput
    UserInput --> ValidateDeadline
    
    ValidateDeadline -->|Yes| ShowWarning
    ValidateDeadline -->|No| CreateChildTask
    
    ShowWarning --> CreateChildTask
    
    CreateChildTask --> UpdateParentProgress
    
    UpdateParentProgress --> CountChildren
    CountChildren --> CountCompleted
    CountCompleted --> CalcProgress
    CalcProgress --> UpdateDB
    
    UpdateDB --> ShowSuccess
    ShowSuccess --> RefreshUI
    
    style UserAction fill:#42A5F5
    style ValidateDeadline fill:#FFA726
    style RefreshUI fill:#66BB6A
```

---

### 8.5 タスク編集処理

```mermaid
flowchart TD
    UserEdit[ユーザーがタスク編集]
    
    LoadCurrent[現在のタスクデータ取得]
    
    ShowEditForm[編集フォーム表示<br/>既存値入力済み]
    
    UserModify[ユーザーが変更]
    
    DetectChanges[変更箇所検出<br/>old vs new]
    
    CheckCompleted{タスクが<br/>完了済み?}
    
    BlockEdit[編集不可エラー]
    
    CheckDetailImprove{詳細度<br/>向上?}
    
    CalcOldDetail[旧詳細度計算]
    CalcNewDetail[新詳細度計算]
    
    NoBonus[通常更新のみ]
    
    ConsumeStamina[スタミナ消費<br/>5pt]
    
    BonusCoin[追加コイン付与<br/>差分 × 5]
    
    UpdateTask[UPDATE tasks<br/>trigger_on_task_edit実行]
    
    RealtimeNotify[Realtime通知<br/>他デバイスに配信]
    
    UpdateCache[ローカルキャッシュ更新]
    
    ShowSuccess[成功通知]
    RefreshUI[UI更新]
    
    UserEdit --> LoadCurrent
    LoadCurrent --> ShowEditForm
    ShowEditForm --> UserModify
    UserModify --> DetectChanges
    
    DetectChanges --> CheckCompleted
    
    CheckCompleted -->|Yes| BlockEdit
    CheckCompleted -->|No| CheckDetailImprove
    
    CheckDetailImprove --> CalcOldDetail
    CalcOldDetail --> CalcNewDetail
    
    CalcNewDetail --> CheckDetailImprove
    
    CheckDetailImprove -->|No| NoBonus
    CheckDetailImprove -->|Yes| ConsumeStamina
    
    ConsumeStamina --> BonusCoin
    BonusCoin --> UpdateTask
    NoBonus --> UpdateTask
    
    UpdateTask --> RealtimeNotify
    RealtimeNotify --> UpdateCache
    UpdateCache --> ShowSuccess
    ShowSuccess --> RefreshUI
    
    style UserEdit fill:#42A5F5
    style CheckCompleted fill:#EF5350
    style RefreshUI fill:#66BB6A
```

---

### 8.6 タスク削除処理（論理削除）

```mermaid
flowchart TD
    UserDelete[ユーザーがスワイプ左<br/>または削除ボタン]
    
    ShowConfirm[確認ダイアログ表示<br/>本当に削除しますか?]
    
    UserConfirm{ユーザー<br/>確認?}
    
    Cancel[キャンセル]
    
    CheckChildren{子タスク<br/>存在?}
    
    ShowChildWarning[警告表示<br/>子タスクも削除されます]
    
    UserFinalConfirm{続行?}
    
    LogicalDelete[論理削除実行<br/>UPDATE deleted_at = now]
    
    DeleteChildren[子タスクも論理削除<br/>CASCADE]
    
    UpdateParent{親タスク<br/>あり?}
    
    RecalcProgress[親の進捗再計算<br/>削除したタスク除外]
    
    UpdateParentDB[親タスクUPDATE]
    
    RealtimeNotify[Realtime通知]
    
    UpdateCache[ローカルキャッシュ更新]
    
    ShowSuccess[削除完了通知]
    
    FadeOutAnimation[フェードアウト<br/>アニメーション]
    
    RemoveFromUI[UI更新<br/>リストから除去]
    
    UserDelete --> ShowConfirm
    ShowConfirm --> UserConfirm
    
    UserConfirm -->|No| Cancel
    UserConfirm -->|Yes| CheckChildren
    
    CheckChildren -->|Yes| ShowChildWarning
    CheckChildren -->|No| LogicalDelete
    
    ShowChildWarning --> UserFinalConfirm
    
    UserFinalConfirm -->|No| Cancel
    UserFinalConfirm -->|Yes| LogicalDelete
    
    LogicalDelete --> DeleteChildren
    DeleteChildren --> UpdateParent
    
    UpdateParent -->|Yes| RecalcProgress
    UpdateParent -->|No| RealtimeNotify
    
    RecalcProgress --> UpdateParentDB
    UpdateParentDB --> RealtimeNotify
    
    RealtimeNotify --> UpdateCache
    UpdateCache --> ShowSuccess
    ShowSuccess --> FadeOutAnimation
    FadeOutAnimation --> RemoveFromUI
    
    style UserDelete fill:#EF5350
    style ShowChildWarning fill:#FFA726
    style RemoveFromUI fill:#66BB6A
```

---

### 8.7 統計画面表示処理

```mermaid
flowchart TD
    UserNavigate[ユーザーが統計タブをタップ]
    
    ShowLoading[ローディング表示]
    
    FetchStats[統計データ取得<br/>v_task_statistics]
    
    FetchRewards[報酬履歴取得<br/>reward_history]
    
    FetchStamina[スタミナ履歴取得<br/>stamina_history]
    
    CalcPeriod[期間別集計<br/>今日/今週/今月/全期間]
    
    subgraph "タスク統計"
        CountCompleted[完了数]
        CountActive[進行中]
        CountOverdue[期限切れ]
        SumHours[累計時間]
    end
    
    subgraph "報酬統計"
        TotalCoins[累計コイン]
        TotalCrystals[累計クリスタル]
        RewardTimeline[獲得推移グラフ]
    end
    
    subgraph "ジャンル統計"
        GenreBreakdown[ジャンル別完了数]
        GenreHours[ジャンル別時間]
    end
    
    RenderCharts[グラフ描画<br/>Chart.js or Recharts]
    
    RenderTables[テーブル表示<br/>ランキング等]
    
    ShowComplete[統計画面表示完了]
    
    UserNavigate --> ShowLoading
    ShowLoading --> FetchStats
    
    FetchStats --> FetchRewards
    FetchRewards --> FetchStamina
    
    FetchStamina --> CalcPeriod
    
    CalcPeriod --> CountCompleted
    CalcPeriod --> CountActive
    CalcPeriod --> CountOverdue
    CalcPeriod --> SumHours
    
    CalcPeriod --> TotalCoins
    CalcPeriod --> TotalCrystals
    CalcPeriod --> RewardTimeline
    
    CalcPeriod --> GenreBreakdown
    CalcPeriod --> GenreHours
    
    SumHours --> RenderCharts
    RewardTimeline --> RenderCharts
    GenreBreakdown --> RenderCharts
    
    CountCompleted --> RenderTables
    GenreHours --> RenderTables
    
    RenderCharts --> ShowComplete
    RenderTables --> ShowComplete
    
    style UserNavigate fill:#42A5F5
    style RenderCharts fill:#FFA726
    style ShowComplete fill:#66BB6A
```

---

### 8.8 エラーハンドリング処理

```mermaid
flowchart TD
    Operation[何らかの操作実行]
    
    TryCatch[try-catch実行]
    
    CheckError{エラー<br/>発生?}
    
    Success[成功処理]
    
    IdentifyError[エラー種別判定]
    
    subgraph "エラー種別"
        NetworkError[ネットワークエラー<br/>offline/timeout]
        AuthError[認証エラー<br/>401/403]
        ValidationError[バリデーションエラー<br/>400]
        StaminaError[スタミナ不足]
        DBError[データベースエラー<br/>500]
        UnknownError[その他エラー]
    end
    
    HandleNetwork[オフライン処理<br/>→ キューに保存]
    HandleAuth[再認証促す<br/>→ ログイン画面]
    HandleValidation[ユーザーに通知<br/>入力修正を促す]
    HandleStamina[スタミナ不足通知<br/>回復時間表示]
    HandleDB[リトライ実行<br/>3回まで]
    HandleUnknown[エラーログ記録<br/>サポート案内]
    
    ShowToast[トースト通知表示]
    
    LogError[エラーログ記録<br/>console.error]
    
    RollbackUI[UI状態をロールバック]
    
    End[処理終了]
    
    Operation --> TryCatch
    TryCatch --> CheckError
    
    CheckError -->|No| Success
    CheckError -->|Yes| IdentifyError
    
    IdentifyError --> NetworkError
    IdentifyError --> AuthError
    IdentifyError --> ValidationError
    IdentifyError --> StaminaError
    IdentifyError --> DBError
    IdentifyError --> UnknownError
    
    NetworkError --> HandleNetwork
    AuthError --> HandleAuth
    ValidationError --> HandleValidation
    StaminaError --> HandleStamina
    DBError --> HandleDB
    UnknownError --> HandleUnknown
    
    HandleNetwork --> ShowToast
    HandleAuth --> ShowToast
    HandleValidation --> ShowToast
    HandleStamina --> ShowToast
    HandleDB --> ShowToast
    HandleUnknown --> ShowToast
    
    ShowToast --> LogError
    LogError --> RollbackUI
    
    Success --> End
    RollbackUI --> End
    
    style Operation fill:#42A5F5
    style IdentifyError fill:#FFA726
    style StaminaError fill:#EF5350
    style End fill:#66BB6A
```

---

**End of Architecture & Data Flow Diagrams**

## VSCodeでの表示方法

1. VSCodeで本ファイルを開く
2. 拡張機能「Markdown Preview Mermaid Support」をインストール
   - ID: `bierner.markdown-mermaid`
3. `Ctrl+Shift+V`でプレビュー表示

## GitHubでの表示

GitHubに本ファイルをプッシュすると、自動的に図として表示されます。
