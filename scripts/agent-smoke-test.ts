/**
 * エージェント運用スモークテスト
 * - MODEL_USAGE.md を実行ログとして出力
 * - 非Codexモデルがサブエージェントに割り当てられていることを確認
 */

import fs from 'fs';
import path from 'path';

type AgentLike = {
  model?: string;
  fallback_models?: string[];
};

type ModelEntry = {
  name: string;
  model: string;
  fallback: string[];
  provider: string;
  isCodex: boolean;
};

function readFileOrExit(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ ファイルを読み込めません: ${filePath}`);
    console.error(error);
    process.exit(1);
  }
}

function stripJsonComments(input: string): string {
  let result = '';
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inSingleLineComment) {
      if (char === '\n') {
        inSingleLineComment = false;
        result += char;
      }
      continue;
    }

    if (inMultiLineComment) {
      if (char === '*' && next === '/') {
        inMultiLineComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (char === '\\') {
        result += char;
        if (next) {
          result += next;
          i++;
        }
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      result += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === '/' && next === '/') {
      inSingleLineComment = true;
      i++;
      continue;
    }

    if (char === '/' && next === '*') {
      inMultiLineComment = true;
      i++;
      continue;
    }

    result += char;
  }

  return result;
}

function parseConfig(configText: string): Record<string, unknown> {
  try {
    const cleaned = stripJsonComments(configText);
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (error) {
    console.error('❌ JSONCの解析に失敗しました');
    console.error(error);
    process.exit(1);
  }
}

function getModelEntries(items: Record<string, AgentLike>): ModelEntry[] {
  return Object.entries(items).map(([name, config]) => {
    const model = config.model;
    if (!model || typeof model !== 'string') {
      console.error(`❌ モデルが未設定です: ${name}`);
      process.exit(1);
    }

    const fallback = Array.isArray(config.fallback_models)
      ? config.fallback_models
      : [];
    const provider = model.includes('/') ? model.split('/')[0] : 'unknown';
    const isCodex = model.includes('codex');

    return { name, model, fallback, provider, isCodex };
  });
}

function printEntries(title: string, entries: ModelEntry[]) {
  console.log(title);
  entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((entry) => {
      const fallbackLabel = entry.fallback.length > 0
        ? entry.fallback.join(', ')
        : '-';
      console.log(
        `- ${entry.name}: ${entry.model} (provider=${entry.provider}, codex=${entry.isCodex ? 'yes' : 'no'}, fallback=${fallbackLabel})`
      );
    });
  console.log('');
}

function ensureNonCodex(label: string, entries: ModelEntry[]) {
  const nonCodex = entries.filter((entry) => !entry.isCodex);
  if (nonCodex.length === 0) {
    console.error(`❌ ${label}: 非Codexモデルが見つかりませんでした`);
    process.exit(1);
  }

  console.log(`✅ ${label}: 非Codexモデルの割当あり`);
  console.log(`   -> ${nonCodex.map((entry) => entry.name).join(', ')}`);
  console.log('');
}

function main() {
  const rootDir = process.cwd();
  const modelUsagePath = path.resolve(rootDir, 'docs', 'guides', 'MODEL_USAGE.md');
  const configPath = path.resolve(rootDir, '.opencode', 'oh-my-opencode.jsonc');

  console.log('=== Agent Smoke Test ===');
  console.log('非Codexサブエージェントが起動した');
  console.log('');

  console.log('[1/3] MODEL_USAGE.md');
  const modelUsage = readFileOrExit(modelUsagePath);
  console.log('--- MODEL_USAGE.md (begin) ---');
  console.log(modelUsage.trimEnd());
  console.log('--- MODEL_USAGE.md (end) ---');
  console.log('');

  console.log('[2/3] .opencode/oh-my-opencode.jsonc');
  const configText = readFileOrExit(configPath);
  const config = parseConfig(configText);

  const agents = (config.agents ?? {}) as Record<string, AgentLike>;
  const categories = (config.categories ?? {}) as Record<string, AgentLike>;

  const agentEntries = getModelEntries(agents);
  const categoryEntries = getModelEntries(categories);

  printEntries('エージェント一覧', agentEntries);
  printEntries('カテゴリ一覧', categoryEntries);

  console.log('[3/3] 非Codexモデルの割当確認');
  ensureNonCodex('agents', agentEntries);
  ensureNonCodex('categories', categoryEntries);

  console.log('✅ スモークテスト完了');
}

main();
