/**
 * エクスポートユーティリティ
 *
 * タスクデータのCSV/JSONエクスポート機能
 * - CSV形式でのエクスポート
 * - JSON形式でのエクスポート
 * - ファイルダウンロード処理
 */

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { TaskWithGenre } from '@/types/database';

/**
 * タスクデータをCSV形式でエクスポート
 */
export const exportTasksAsCSV = (tasks: TaskWithGenre[]): void => {
  // CSVヘッダー
  const headers = [
    'ID',
    'タイトル',
    'ジャンル',
    '期限',
    '見積時間',
    '完了状態',
    '完了日時',
    '詳細レベル',
    '作成日時',
  ];

  // CSVデータ行
  const rows = tasks.map((task) => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`, // ダブルクォートをエスケープ
    task.genre ? `"${task.genre.name.replace(/"/g, '""')}"` : '',
    format(new Date(task.deadline), 'yyyy-MM-dd HH:mm', { locale: ja }),
    task.estimated_hours,
    task.is_completed ? '完了' : '未完了',
    task.completed_at
      ? format(new Date(task.completed_at), 'yyyy-MM-dd HH:mm', { locale: ja })
      : '',
    task.detail_level,
    format(new Date(task.created_at), 'yyyy-MM-dd HH:mm', { locale: ja }),
  ]);

  // CSV文字列を生成
  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  // BOMを追加（Excel対応）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  // ファイルダウンロード
  downloadFile(blob, `tasks_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
};

/**
 * タスクデータをJSON形式でエクスポート
 */
export const exportTasksAsJSON = (tasks: TaskWithGenre[]): void => {
  // JSON形式に整形
  const jsonData = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    genre: task.genre
      ? {
          id: task.genre.id,
          name: task.genre.name,
          color: task.genre.color,
        }
      : null,
    deadline: task.deadline,
    estimated_hours: task.estimated_hours,
    benefits: task.benefits,
    is_completed: task.is_completed,
    completed_at: task.completed_at,
    completion_progress: task.completion_progress,
    detail_level: task.detail_level,
    has_prerequisites: task.has_prerequisites,
    has_benefits: task.has_benefits,
    checklist: task.checklist?.map((item) => ({
      id: item.id,
      item_text: item.item_text,
      is_checked: item.is_checked,
      display_order: item.display_order,
    })),
    created_at: task.created_at,
    updated_at: task.updated_at,
  }));

  // JSON文字列を生成（整形付き）
  const json = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });

  // ファイルダウンロード
  downloadFile(blob, `tasks_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
};

/**
 * 統計データをJSON形式でエクスポート
 */
export const exportStatisticsAsJSON = (
  tasks: TaskWithGenre[],
  stats: {
    totalCompleted: number;
    totalTasks: number;
    completionRate: number;
    genreBreakdown: { name: string; count: number }[];
  }
): void => {
  const statisticsData = {
    exported_at: new Date().toISOString(),
    summary: {
      total_tasks: stats.totalTasks,
      completed_tasks: stats.totalCompleted,
      completion_rate: stats.completionRate,
    },
    genre_breakdown: stats.genreBreakdown,
    tasks_by_status: {
      completed: tasks.filter((t) => t.is_completed).length,
      pending: tasks.filter((t) => !t.is_completed).length,
    },
  };

  const json = JSON.stringify(statisticsData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });

  downloadFile(blob, `statistics_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
};

/**
 * ファイルダウンロード処理
 */
const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
