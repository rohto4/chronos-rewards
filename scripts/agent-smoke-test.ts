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

type RuntimeEntry = {
  provider: string;
  model: string;
  agent: string;
  timestamp?: Date;
  isCodex: boolean;
};

const runtimeLineRegex = /service=llm\b.*?providerID=([^\s]+).*?modelID=([^\s]+)(?:.*?agent=([^\s]+))?/;
const excludedRuntimeAgents = new Set(['title', 'build']);

function isCodexModel(model: string): boolean {
  return model.includes('codex');
}

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
    const isCodex = isCodexModel(model);

    return { name, model, fallback, provider, isCodex };
  });
}

function listLogFiles(logDir: string): string[] {
  try {
    return fs
      .readdirSync(logDir)
      .filter((name) => name.endsWith('.log'))
      .map((name) => path.join(logDir, name))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  } catch (error) {
    console.error(`❌ ログディレクトリの読み込みに失敗しました: ${logDir}`);
    console.error(error);
    process.exit(1);
  }
}

function getOpencodeLogDir(): string | null {
  const envDir = process.env.OPENCODE_LOG_DIR?.trim();
  if (envDir) {
    return envDir;
  }

  const candidates: string[] = [];
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    candidates.push(path.join(localAppData, 'ai.opencode.desktop', 'logs'));
  }

  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (homeDir) {
    candidates.push(
      path.join(homeDir, '.local', 'share', 'opencode', 'log'),
      path.join(homeDir, '.local', 'share', 'ai.opencode.desktop', 'logs'),
      path.join(homeDir, 'Library', 'Logs', 'ai.opencode.desktop')
    );
  }

  let bestDir: string | null = null;
  let bestMtime = -1;
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const files = listLogFiles(candidate);
    if (files.length === 0) {
      continue;
    }
    const latest = fs.statSync(files[0]).mtimeMs;
    if (latest > bestMtime) {
      bestMtime = latest;
      bestDir = candidate;
    }
  }

  return bestDir;
}

function parseRuntimeLine(line: string): RuntimeEntry | null {
  const match = runtimeLineRegex.exec(line);
  if (!match) {
    return null;
  }

  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[^\s]+)/);
  const timestamp = timestampMatch ? new Date(timestampMatch[1]) : undefined;
  const provider = match[1];
  const model = match[2];
  const agent = match[3] ?? '-';

  return {
    provider,
    model,
    agent,
    timestamp,
    isCodex: isCodexModel(model),
  };
}

function filterSubagentEntries(entries: RuntimeEntry[]): RuntimeEntry[] {
  return entries.filter((entry) => {
    if (!entry.agent || entry.agent === '-') {
      return false;
    }
    if (excludedRuntimeAgents.has(entry.agent)) {
      return false;
    }
    return true;
  });
}

function collectRuntimeEntries(logDir: string, since: Date, maxFiles: number): RuntimeEntry[] {
  const logFiles = listLogFiles(logDir).slice(0, maxFiles);
  if (logFiles.length === 0) {
    console.error(`❌ ログファイルが見つかりません: ${logDir}`);
    process.exit(1);
  }

  const entries: RuntimeEntry[] = [];
  for (const filePath of logFiles) {
    const content = readFileOrExit(filePath);
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const entry = parseRuntimeLine(line);
      if (!entry) {
        continue;
      }
      if (!entry.timestamp || entry.timestamp >= since) {
        entries.push(entry);
      }
    }
  }

  return entries;
}

function printRuntimeEntries(entries: RuntimeEntry[]) {
  const unique = new Map<string, RuntimeEntry>();
  entries.forEach((entry) => {
    const key = `${entry.provider}|${entry.model}|${entry.agent}`;
    if (!unique.has(key)) {
      unique.set(key, entry);
    }
  });

  console.log('LLM 実行ログ（サブエージェント/ユニーク）');
  Array.from(unique.values())
    .sort((a, b) => {
      const modelCompare = a.model.localeCompare(b.model);
      if (modelCompare !== 0) {
        return modelCompare;
      }
      return a.agent.localeCompare(b.agent);
    })
    .forEach((entry) => {
      console.log(
        `- ${entry.model} (provider=${entry.provider}, codex=${entry.isCodex ? 'yes' : 'no'}, agent=${entry.agent})`
      );
    });
  console.log('');
}

function ensureRuntimeNonCodex(entries: RuntimeEntry[]) {
  const nonCodex = entries.filter((entry) => !entry.isCodex);
  if (nonCodex.length === 0) {
    console.error('❌ runtime: 非Codexモデルの実行ログが見つかりませんでした');
    process.exit(1);
  }

  const names = Array.from(new Set(nonCodex.map((entry) => entry.model)));
  console.log('✅ runtime: 非Codexモデルの実行ログあり');
  console.log(`   -> ${names.join(', ')}`);
  console.log('');
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
  console.log('');

  console.log('[1/4] MODEL_USAGE.md');
  const modelUsage = readFileOrExit(modelUsagePath);
  console.log('--- MODEL_USAGE.md (begin) ---');
  console.log(modelUsage.trimEnd());
  console.log('--- MODEL_USAGE.md (end) ---');
  console.log('');

  console.log('[2/4] .opencode/oh-my-opencode.jsonc');
  const configText = readFileOrExit(configPath);
  const config = parseConfig(configText);

  const agents = (config.agents ?? {}) as Record<string, AgentLike>;
  const categories = (config.categories ?? {}) as Record<string, AgentLike>;

  const agentEntries = getModelEntries(agents);
  const categoryEntries = getModelEntries(categories);

  printEntries('エージェント一覧', agentEntries);
  printEntries('カテゴリ一覧', categoryEntries);

  console.log('[3/4] opencode 実行ログ');
  const logDir = getOpencodeLogDir();
  if (!logDir) {
    console.error('❌ opencode のログディレクトリが見つかりません');
    console.error('   -> OPENCODE_LOG_DIR 環境変数でパスを指定してください');
    process.exit(1);
  }

  const sinceMinutesRaw = process.env.OPENCODE_LOG_SINCE_MINUTES ?? '60';
  const sinceMinutes = Number(sinceMinutesRaw);
  if (!Number.isFinite(sinceMinutes) || sinceMinutes <= 0) {
    console.error(`❌ OPENCODE_LOG_SINCE_MINUTES が不正です: ${sinceMinutesRaw}`);
    process.exit(1);
  }

  const maxFilesRaw = process.env.OPENCODE_LOG_MAX_FILES ?? '5';
  const maxFiles = Number(maxFilesRaw);
  if (!Number.isFinite(maxFiles) || maxFiles <= 0) {
    console.error(`❌ OPENCODE_LOG_MAX_FILES が不正です: ${maxFilesRaw}`);
    process.exit(1);
  }

  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  console.log(`ログディレクトリ: ${logDir}`);
  console.log(`検索開始時刻: ${since.toISOString()}`);
  console.log(`検索対象ファイル数: ${maxFiles}`);
  const runtimeEntries = collectRuntimeEntries(logDir, since, maxFiles);
  const subagentEntries = filterSubagentEntries(runtimeEntries);

  if (subagentEntries.length === 0) {
    console.error('❌ LLM 実行ログ（サブエージェント）が見つかりませんでした');
    console.error('   -> @prometheus / @librarian などの実行後に再試行してください');
    console.error('   -> logLevel=DEBUG が有効かも確認してください');
    process.exit(1);
  }

  printRuntimeEntries(subagentEntries);
  ensureRuntimeNonCodex(subagentEntries);
  console.log('非Codexサブエージェントが起動した');
  console.log('');

  console.log('[4/4] 非Codexモデルの割当確認');
  ensureNonCodex('agents', agentEntries);
  ensureNonCodex('categories', categoryEntries);

  console.log('✅ スモークテスト完了');
}

main();
