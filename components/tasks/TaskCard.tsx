/**
 * TaskCardコンポーネント
 * 
 * タスク情報を表示するカード
 * - ジャンルバッジ
 * - 期限表示（色分け）
 * - チェックリスト進捗
 * - 完了・削除アクション
 * - スワイプアクション
 */

'use client';

import { useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Calendar, Clock, CheckSquare, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { TaskWithGenre } from '@/types/database';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

/**
 * TaskCardコンポーネントのプロパティ型
 */
export interface TaskCardProps {
  task: TaskWithGenre;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onClick?: () => void;
}

/**
 * TaskCardコンポーネント
 */
export const TaskCard = ({
  task,
  onComplete,
  onDelete,
  onClick,
}: TaskCardProps) => {
  /**
   * 期限の状態を計算
   */
  const deadlineStatus = useMemo(() => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const daysUntil = differenceInDays(deadline, now);

    if (task.is_completed) {
      return { variant: 'success' as const, label: '完了', color: 'text-green-600' };
    }

    if (isPast(deadline)) {
      return { variant: 'danger' as const, label: '期限切れ', color: 'text-red-600' };
    }

    if (isToday(deadline)) {
      return { variant: 'warning' as const, label: '今日まで', color: 'text-yellow-600' };
    }

    if (daysUntil <= 3) {
      return { variant: 'warning' as const, label: `残り${daysUntil}日`, color: 'text-yellow-600' };
    }

    if (daysUntil <= 7) {
      return { variant: 'info' as const, label: `残り${daysUntil}日`, color: 'text-blue-600' };
    }

    return { variant: 'default' as const, label: `残り${daysUntil}日`, color: 'text-gray-600' };
  }, [task.deadline, task.is_completed]);

  /**
   * チェックリスト進捗を計算
   */
  const checklistProgress = useMemo(() => {
    if (!task.checklist || task.checklist.length === 0) return null;
    
    const completed = task.checklist.filter((item) => item.is_checked).length;
    const total = task.checklist.length;
    const percentage = (completed / total) * 100;

    return { completed, total, percentage };
  }, [task.checklist]);

  /**
   * スワイプで削除
   */
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!task.is_completed) {
        onDelete(task.id);
      }
    },
    trackMouse: false,
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      {...handlers}
    >
      <Card
        variant="default"
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow',
          task.is_completed && 'opacity-60'
        )}
        onClick={onClick}
      >
        <CardBody className="space-y-3">
          {/* ヘッダー行: ジャンル + 期限 */}
          <div className="flex items-start justify-between gap-2">
            {/* ジャンルバッジ */}
            {task.genre && (
              <Badge
                variant="default"
                style={{
                  backgroundColor: `${task.genre.color}20`,
                  color: task.genre.color,
                }}
              >
                {task.genre.name}
              </Badge>
            )}

            {/* 期限バッジ */}
            <Badge variant={deadlineStatus.variant} dot>
              {deadlineStatus.label}
            </Badge>
          </div>

          {/* タイトル */}
          <h3
            className={cn(
              'text-lg font-semibold text-gray-900',
              task.is_completed && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </h3>

          {/* 説明文 */}
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* 詳細情報行 */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {/* 期限日時 */}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(task.deadline), 'M/d (E)', { locale: ja })}
              </span>
            </div>

            {/* 見積時間 */}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{task.estimated_hours}h</span>
            </div>

            {/* チェックリスト進捗 */}
            {checklistProgress && (
              <div className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4" />
                <span>
                  {checklistProgress.completed}/{checklistProgress.total}
                </span>
              </div>
            )}
          </div>

          {/* チェックリスト進捗バー */}
          {checklistProgress && (
            <Progress
              value={checklistProgress.percentage}
              variant="success"
              size="sm"
            />
          )}

          {/* アクションボタン */}
          {!task.is_completed && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>完了</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                aria-label="削除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};
