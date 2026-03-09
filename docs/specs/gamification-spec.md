# Gamification & Rewards Specification

**Project**: Chronos Rewards
**Status**: Draft
**Last Updated**: 2025-05-XX

## 1. Overview
ユーザーの継続率（Retention）を高めるためのゲーミフィケーション機能仕様。
「時間（Chronos）」をリソースとし、報酬（Rewards）へ変換するプロセスをエンターテインメント化する。

## 2. Functional Requirements

### 2.1 Streak Multiplier (継続ボーナス)
毎日の目標達成により、報酬獲得量にボーナス係数を付与する。
経済圏のインフレを防ぐため、係数の上昇は対数関数的に緩やかにする。

- **ロジック**:
  - 1日目標達成ごとに Streak Count +1
  - 1日未達で Streak Count リセット（0に戻る）
  - **係数計算式**: `Multiplier = 1.0 + (log10(Streak Days + 1) * 0.1)`
    - 7日目: ~1.09x
    - 30日目: ~1.14x
    - 100日目: ~1.20x
  - **上限 (Cap)**: 最大 1.5x

### 2.2 Pomodoro RPG (集中バトル)
ポモドーロ・テクニック（25分集中）をRPGのターンに見立てる。

- **メカニクス**:
  - 1セッション(25分)完了 = 1ターン行動（攻撃/回復/建築）
  - **敵 (Task Enemy)**: タスクの見積もり時間や難易度からHPを生成。
  - **報酬**: 敵撃破時に追加ポイントや素材（Materials）をドロップ。

### 2.3 Skill Tree Visualization (成長可視化)
費やした時間の「タグ」に基づいてスキルツリーが成長する。

- **仕様**:
  - Tag: `Coding`, `Design`, `Writing` など
  - Exp変換: 1分集中 = 1 Exp
  - Level Up: 各タグごとにレベルを持ち、一定レベルで「実（Badge/Icon）」がアンロックされる。

### 2.4 Focus Gacha (報酬消費)
獲得したポイント（Rewards）の消費先。実益に影響しないコスメティック要素を主とする。

- **排出アイテム**:
  - Theme Colors (アプリ配色)
  - Avatar Parts
  - Profile Badges
  - Streak Freeze (継続救済アイテム / 低確率)

### 2.5 Legacy Chronicles (活動記録)
一定期間の活動ログを物語形式で生成・閲覧可能にする。

- **生成単位**: 月次 / 年次
- **内容**: 倒したボス（完了タスク）、獲得スキル、総集中時間をLLM等で英雄譚テキスト化して保存。

---

## 3. Data Requirements (For Implementation)

実装班は以下のデータを永続化できるよう、DBスキーマを設計すること。

### 3.1 User Stats & Economy
- **Streak情報**: 現在の継続日数、最終達成日、過去最高継続日数。
- **Points**: 現在所持している報酬ポイント残高。
- **Multiplier**: 現在適用されているボーナス係数（計算値のキャッシュ可否は検討）。

### 3.2 RPG State
- **Current Battle**: 現在戦っている敵のステータス（HP, MaxHP, 敵タイプ）。
- **Inventory**: 所持している素材やアイテム。

### 3.3 Skill Progression
- **Tag Experience**: ユーザー×タグごとの累積経験値と現在レベル。
- **Unlocks**: 解放済みのスキルノードやバッジ。

### 3.4 Gacha & Collection
- **Collection**: 獲得済みのコスメティックアイテム一覧。
- **Gacha History**: (任意) ガチャ履歴。

### 3.5 Chronicles
- **Chronicle Entries**: 生成された物語テキスト、対象期間、要約データ。

---

## 4. Future Requirements (Phase 3+)

### 4.1 Social Pools (連帯責任モード)
**優先度**: 低（将来実装）

- **概要**: チームで目標時間を設定し、プールされたポイントを共有・没収する仕組み。
- **データ要件**:
  - Pool ID, 参加メンバー, 目標設定, 現在のプール額, 判定ステータス。
  - マルチプレイ基盤が必要となるため、現段階ではテーブル設計に含めなくてよい（または拡張性を考慮する程度）。
