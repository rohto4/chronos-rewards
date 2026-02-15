/**
 * TaskDetailModalコンポーネント
 *
 * タスク詳細表示モーダル
 * - 基本情報表示
 * - チェックリスト編集
 * - 編集モード
 * - 履歴表示
 * - 親子タスク表示
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  X,
  Edit2,
  Check,
  Trash2,
  Calendar,
  Clock,
  Star,
  Gift,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useTaskStore } from '@/lib/stores/task-store';
import { useToast } from '@/components/ui/toast';
import type { TaskWithGenre, TaskUpdate } from '@/types/database';
import { calculateCoinReward, calculateCrystalReward } from '@/lib/utils/reward-utils';

/**
 * TaskDetailModalのプロパティ型
 */
export interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

/**
 * TaskDetailModalコンポーネント
 */
export const TaskDetailModal = ({
  taskId,
  isOpen,
  onClose,
  onComplete,
  onDelete,
}: TaskDetailModalProps) => {
  const { getTaskById, getChildTasks, updateTask, completeTask, deleteTask, updateTaskChecklist } = useTaskStore();
  const { showToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [task, setTask] = useState<TaskWithGenre | null>(null);

  // タスク情報を取得
  useEffect(() => {
    if (taskId) {
      const foundTask = getTaskById(taskId);
      setTask(foundTask || null);
    } else {
      setTask(null);
    }
  }, [taskId, getTaskById]);

  // タスクが見つからない場合
  if (!task) {
    return null;
  }

  const childTasks = getChildTasks(task.id);
  const isParentTask = childTasks.length > 0;

  // チェックリスト進捗計算
  const checklistProgress = task.checklist?.length
    ? (task.checklist.filter(item => item.is_checked).length / task.checklist.length) * 100
    : 0;

  // 報酬計算
  const coinReward = calculateCoinReward(
    task.detail_level,
    task.has_prerequisites,
    task.has_benefits
  );

  const crystalReward = calculateCrystalReward(
    task.estimated_hours,
    task.has_prerequisites,
    task.has_benefits,
    isParentTask
  );

  // 期限までの残り時間を計算
  const getDeadlineStatus = () => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (task.is_completed) {
      return { label: '完了', variant: 'success' as const };
    } else if (diffHours < 0) {
      return { label: '期限切れ', variant: 'danger' as const };
    } else if (diffHours < 24) {
      return { label: '今日まで', variant: 'warning' as const };
    } else if (diffHours < 168) {
      return { label: '今週', variant: 'info' as const };
    } else {
      return { label: format(deadline, 'M/d', { locale: ja }), variant: 'default' as const };
    }
  };

  const deadlineStatus = getDeadlineStatus();

  // 詳細レベルを星で表示
  const renderDetailLevel = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 inline-block ${
          i < task.detail_level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  // チェックリストアイテムのトグル
  const handleChecklistToggle = async (itemId: string) => {
    if (!task.checklist) return;

    const item = task.checklist.find(i => i.id === itemId);
    if (!item) return;

    const newCheckedState = !item.is_checked;

    // 楽観的更新（即座にUIを更新）
    const updatedChecklist = task.checklist.map(i =>
      i.id === itemId ? { ...i, is_checked: newCheckedState } : i
    );
    setTask({ ...task, checklist: updatedChecklist });

    try {
      // task_checklistテーブルを更新
      await updateTaskChecklist(task.id, itemId, newCheckedState);
    } catch (error) {
      console.error('Checklist update error:', error);
      // エラー時はロールバック
      setTask({ ...task, checklist: task.checklist });
      showToast('チェックリストの更新に失敗しました', 'error');
    }
  };

  // タスク編集
  const handleEditSubmit = async (updates: TaskUpdate) => {
    try {
      await updateTask(task.id, updates);
      setIsEditMode(false);
      showToast('タスクを更新しました', 'success');
      onClose();
    } catch (error) {
      console.error('Task update error:', error);
      showToast('タスクの更新に失敗しました', 'error');
    }
  };

  // タスク完了
  const handleComplete = async () => {
    try {
      await completeTask(task.id);
      if (onComplete) {
        onComplete(task.id);
      }
      showToast('タスクを完了しました！', 'success');
      onClose();
    } catch (error) {
      console.error('Task complete error:', error);
      showToast('タスクの完了に失敗しました', 'error');
    }
  };

  // タスク削除
  const handleDelete = async () => {
    if (!confirm('このタスクを削除しますか？')) return;

    try {
      await deleteTask(task.id);
      if (onDelete) {
        onDelete(task.id);
      }
      showToast('タスクを削除しました', 'info');
      onClose();
    } catch (error) {
      console.error('Task delete error:', error);
      showToast('タスクの削除に失敗しました', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'タスクを編集' : 'タスク詳細'}
      size="lg"
    >
      <AnimatePresence mode="wait">
        {isEditMode ? (
          // 編集モード
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TaskForm
              task={task}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditMode(false)}
            />
          </motion.div>
        ) : (
          // 表示モード
          <motion.div
            key="view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* タイトルとバッジ */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {task.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {task.genre && (
                  <Badge
                    variant="default"
                    style={{
                      backgroundColor: `${task.genre.color}20`,
                      color: task.genre.color,
                      borderColor: task.genre.color,
                    }}
                  >
                    {task.genre.name}
                  </Badge>
                )}
                <Badge variant={deadlineStatus.variant}>
                  <Calendar className="w-3 h-3 mr-1" />
                  {deadlineStatus.label}
                </Badge>
                {task.is_completed && (
                  <Badge variant="success">
                    <Check className="w-3 h-3 mr-1" />
                    完了
                  </Badge>
                )}
              </div>
            </div>

            {/* 説明 */}
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">説明</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* チェックリスト */}
            {task.checklist && task.checklist.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  ✓ チェックリスト
                </h3>
                <div className="space-y-2 mb-3">
                  {task.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.is_checked}
                        onChange={() => handleChecklistToggle(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={task.is_completed}
                      />
                      <span
                        className={`flex-1 ${
                          item.is_checked ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {item.item_text}
                      </span>
                    </label>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>進捗</span>
                    <span>{Math.round(checklistProgress)}%</span>
                  </div>
                  <Progress value={checklistProgress} variant="default" />
                </div>
              </div>
            )}

            {/* 詳細情報 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">📊 詳細情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">見積時間</span>
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {task.estimated_hours}時間
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">詳細レベル</span>
                  <span className="flex items-center gap-1">
                    {renderDetailLevel()}
                  </span>
                </div>
                {task.benefits && (
                  <div>
                    <span className="text-gray-600 block mb-1">ベネフィット</span>
                    <p className="text-gray-900 bg-green-50 border border-green-200 rounded-lg p-2">
                      <Gift className="w-4 h-4 inline mr-1 text-green-600" />
                      {task.benefits}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 獲得報酬 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">📈 獲得報酬</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <span className="text-gray-700">コイン（作成時）</span>
                  <span className="font-bold text-yellow-700">💰 +{coinReward}</span>
                </div>
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <span className="text-gray-700">クリスタル（完了時）</span>
                  <span className="font-bold text-purple-700">💎 +{crystalReward}</span>
                </div>
              </div>
            </div>

            {/* 履歴 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">📅 履歴</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>作成</span>
                  <span>{format(new Date(task.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                </div>
                <div className="flex justify-between">
                  <span>更新</span>
                  <span>{format(new Date(task.updated_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                </div>
                {task.completed_at && (
                  <div className="flex justify-between">
                    <span>完了</span>
                    <span>{format(new Date(task.completed_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 子タスク */}
            {isParentTask && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  子タスク ({childTasks.length})
                </h3>
                <div className="space-y-2">
                  {childTasks.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <Check
                        className={`w-4 h-4 ${
                          child.is_completed ? 'text-green-600' : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={`flex-1 ${
                          child.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {child.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsEditMode(true)}
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                編集
              </Button>
              {!task.is_completed && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleComplete}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  完了
                </Button>
              )}
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
