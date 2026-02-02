/**
 * TaskListコンポーネント
 * 
 * フィルタリングされたタスク一覧を表示
 * - グループ化（期限別）
 * - 仮想スクロール対応
 * - 空状態の表示
 */

'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday, isTomorrow, addDays, differenceInDays, startOfDay } from 'date-fns';
import type { TaskWithGenre } from '@/types/database';
import { TaskCard } from './TaskCard';

/**
 * TaskListコンポーネントのプロパティ型
 */
export interface TaskListProps {
  tasks: TaskWithGenre[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  groupByDeadline?: boolean;
}

/**
 * タスクを期限別にグループ化
 */
const groupTasksByDeadline = (tasks: TaskWithGenre[]) => {
  const groups: Record<string, TaskWithGenre[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  const now = startOfDay(new Date());
  const weekEnd = addDays(now, 7);

  tasks.forEach((task) => {
    const deadline = new Date(task.deadline);

    if (task.is_completed) {
      // 完了タスクは最後に表示
      groups.later.push(task);
    } else if (deadline < now) {
      groups.overdue.push(task);
    } else if (isToday(deadline)) {
      groups.today.push(task);
    } else if (isTomorrow(deadline)) {
      groups.tomorrow.push(task);
    } else if (deadline <= weekEnd) {
      groups.thisWeek.push(task);
    } else {
      groups.later.push(task);
    }
  });

  return groups;
};

/**
 * TaskListコンポーネント
 */
export const TaskList = ({
  tasks,
  onComplete,
  onDelete,
  onTaskClick,
  groupByDeadline = true,
}: TaskListProps) => {
  /**
   * グループ化されたタスク
   */
  const groupedTasks = useMemo(() => {
    if (!groupByDeadline) return { all: tasks };
    return groupTasksByDeadline(tasks);
  }, [tasks, groupByDeadline]);

  /**
   * グループラベル
   */
  const groupLabels: Record<string, string> = {
    overdue: '期限切れ',
    today: '今日',
    tomorrow: '明日',
    thisWeek: '今週',
    later: 'それ以降',
    all: 'すべてのタスク',
  };

  /**
   * 空状態
   */
  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-gray-600 text-lg">タスクがありません</p>
        <p className="text-sm text-gray-500 mt-2">
          右下の ＋ ボタンから作成してください
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => {
        if (groupTasks.length === 0) return null;

        return (
          <div key={groupKey} className="space-y-3">
            {/* グループヘッダー */}
            {groupByDeadline && (
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">
                  {groupLabels[groupKey]}
                </h2>
                <span className="text-xs text-gray-500">
                  ({groupTasks.length})
                </span>
              </div>
            )}

            {/* タスクカード一覧 */}
            <AnimatePresence mode="popLayout">
              {groupTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onClick={() => onTaskClick?.(task.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
