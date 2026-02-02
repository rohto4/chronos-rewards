/**
 * QuickAddButtonsコンポーネント
 * 
 * フローティングアクションボタン（FAB）
 * - タスク作成モーダル
 * - アニメーション対応
 * - クイック登録オプション
 */

'use client';

import { useState } from 'react';
import { Plus, Zap, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useTaskStore } from '@/lib/stores/task-store';
import { useToast } from '@/components/ui/toast';
import type { TaskInsert } from '@/types/database';

/**
 * QuickAddButtonsコンポーネント
 */
export const QuickAddButtons = () => {
  const { createTask } = useTaskStore();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * タスク作成処理
   */
  const handleCreateTask = async (taskData: TaskInsert) => {
    try {
      await createTask(taskData);
      setIsModalOpen(false);
      showToast('タスクを作成しました', 'success');
    } catch (error) {
      console.error('Create task error:', error);
      showToast('タスクの作成に失敗しました', 'error');
    }
  };

  /**
   * クイックタスク作成（今日締切）
   */
  const handleQuickAddToday = () => {
    setIsModalOpen(true);
    setIsExpanded(false);
  };

  /**
   * クイックタスク作成（今週締切）
   */
  const handleQuickAddWeek = () => {
    setIsModalOpen(true);
    setIsExpanded(false);
  };

  return (
    <>
      {/* FABグループ */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        {/* サブボタン */}
        <AnimatePresence>
          {isExpanded && (
            <>
              <motion.button
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: 0.1 }}
                onClick={handleQuickAddToday}
                className="flex items-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">今日のタスク</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: 0.05 }}
                onClick={handleQuickAddWeek}
                className="flex items-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium">今週のタスク</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* メインボタン */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isExpanded) {
              setIsModalOpen(true);
              setIsExpanded(false);
            } else {
              setIsExpanded(true);
            }
          }}
          className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all ${
            isExpanded
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-8 h-8 text-white" />
          </motion.div>
        </motion.button>
      </div>

      {/* バックドロップ（展開時） */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/20 z-30"
          />
        )}
      </AnimatePresence>

      {/* タスク作成モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新しいタスクを作成"
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};
