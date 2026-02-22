# MODEL_USAGE.md

## 目的
モデルの役割分担と使用率の目安を明文化し、運用上の判断基準を揃えるためのガイドです。

## 参照元（最優先）
このドキュメントは運用ルールであり、実装の単一ソースは以下です。

- `.opencode/oh-my-opencode.jsonc`

差分が出た場合は **設定ファイルを優先** し、MODEL_USAGE.md を追随更新してください。

## 目標使用率（目安）
タスク内容によって実際の割合は前後します。厳密制御はできないため、下記は誘導目標です。

| モデル | 目標 | 主な担当 |
| --- | --- | --- |
| openai/gpt-5.1-codex-mini | 40〜48% | deep / logic-testing / e2e-testing / sisyphus |
| anthropic/claude-sonnet-4-5-20250929 | 22〜30% | visual-engineering / unspecified-high / prometheus / oracle |
| anthropic/claude-haiku-4-5-20250929 | 15〜22% | quick / writing / unspecified-low / librarian / explore |
| openai/gpt-5.2-codex | 8〜12% | refactoring / atlas / hephaestus |
| openai/gpt-5.2 | 1〜3% | ultrabrain |

## 調整レバー
使用率の調整は「割り当ての誘導」で行います。

- `categories` のモデル割当を変更する
- `agents` のモデル割当を変更する
- `background_task.providerConcurrency` / `modelConcurrency` を調整する
- `runtime_fallback` のフォールバック順を調整する

## 運用ルール
- 使用率は自動計測・自動調整されません。必要に応じて運用上の判断で調整してください。
- 変更時は必ず `.opencode/oh-my-opencode.jsonc` と MODEL_USAGE.md の双方を更新します。
- 目標使用率は「目安」です。タスクの性質が変わる場合は比率を見直してください。
