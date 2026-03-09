/**
 * タスク所要時間サマリ
 *
 * docs/implementation/active-tasks.json を読み込み、
 * startedAt / completedAt から所要時間を集計する。
 *
 * 実行方法:
 * npm run tasks:summary
 */

import fs from 'fs';
import path from 'path';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | string;

type TaskRecord = {
  id: string;
  title: string;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
};

type ActiveTasks = {
  tasks: TaskRecord[];
};

const tasksPath = path.resolve(
  process.cwd(),
  'docs',
  'implementation',
  'active-tasks.json'
);

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0m';
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return '<1m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatTaskLabel(task: TaskRecord): string {
  return `${task.id} ${task.title}`;
}

function loadTasks(): ActiveTasks {
  const raw = fs.readFileSync(tasksPath, 'utf8');
  const parsed = JSON.parse(raw) as ActiveTasks;
  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error('active-tasks.json の形式が不正です。');
  }
  return parsed;
}

function printSection(title: string) {
  console.log('');
  console.log(title);
  console.log('-'.repeat(title.length));
}

function main() {
  const now = new Date();
  const { tasks } = loadTasks();

  const completed: Array<{ task: TaskRecord; durationMs: number; start: Date; end: Date }> = [];
  const inProgress: Array<{ task: TaskRecord; elapsedMs: number; start: Date }> = [];
  const invalid: Array<{ task: TaskRecord; reason: string }> = [];

  let pendingCount = 0;

  for (const task of tasks) {
    const start = parseDate(task.startedAt);
    const end = parseDate(task.completedAt);

    if (task.status === 'completed') {
      if (!start || !end) {
        invalid.push({
          task,
          reason: 'completed だが startedAt / completedAt が不足',
        });
        continue;
      }
      completed.push({ task, durationMs: end.getTime() - start.getTime(), start, end });
      continue;
    }

    if (task.status === 'in_progress') {
      if (!start) {
        invalid.push({ task, reason: 'in_progress だが startedAt が不足' });
        continue;
      }
      inProgress.push({ task, elapsedMs: now.getTime() - start.getTime(), start });
      continue;
    }

    pendingCount += 1;
  }

  console.log('タスク時間サマリ');
  console.log(`取得元: ${tasksPath}`);
  console.log(`集計時刻(UTC): ${now.toISOString()}`);

  if (completed.length > 0) {
    printSection('完了タスク');
    for (const item of completed) {
      const duration = formatDuration(item.durationMs);
      console.log(
        `- ${formatTaskLabel(item.task)} | ${duration} | ${item.start.toISOString()} -> ${item.end.toISOString()}`
      );
    }
  }

  if (inProgress.length > 0) {
    printSection('進行中タスク');
    for (const item of inProgress) {
      const duration = formatDuration(item.elapsedMs);
      console.log(
        `- ${formatTaskLabel(item.task)} | 経過 ${duration} | ${item.start.toISOString()}`
      );
    }
  }

  if (invalid.length > 0) {
    printSection('要確認');
    for (const item of invalid) {
      console.log(`- ${formatTaskLabel(item.task)} | ${item.reason}`);
    }
  }

  const totalCompletedMs = completed.reduce((sum, item) => sum + item.durationMs, 0);
  const avgMs = completed.length > 0 ? Math.round(totalCompletedMs / completed.length) : 0;

  printSection('集計');
  console.log(`完了件数: ${completed.length}`);
  console.log(`進行中: ${inProgress.length}`);
  console.log(`未着手: ${pendingCount}`);
  if (completed.length > 0) {
    console.log(`完了合計: ${formatDuration(totalCompletedMs)}`);
    console.log(`完了平均: ${formatDuration(avgMs)}`);
  }
}

main();
