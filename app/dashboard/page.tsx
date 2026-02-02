/**
 * ダッシュボードページ（完成版 - Phase 2対応）
 * 
 * アプリのメイン画面
 * - ヘッダー（報酬・スタミナ表示）
 * - フィルタチップ
 * - タスク一覧
 * - クイック登録ボタン（FAB）
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserStore } from '@/lib/stores/user-store';
import { useTaskStore } from '@/lib/stores/task-store';
import { useGenreStore } from '@/lib/stores/genre-store';
import { Header } from '@/components/layout/Header';
import { FilterChips } from '@/components/layout/FilterChips';
import { QuickAddButtons } from '@/components/layout/QuickAddButtons';
import { TaskCard } from '@/components/tasks/TaskCard';
import { RewardAnimation } from '@/components/animations/RewardAnimation';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, fetchProfile, recoverStamina } = useUserStore();
  const { filteredTasks, fetchTasks, completeTask, deleteTask } = useTaskStore();
  const { fetchGenres } = useGenreStore();
  const { showToast } = useToast();

  // アニメーション状態
  const [rewardAnimation, setRewardAnimation] = useState<{
    type: 'coin' | 'crystal' | 'levelup' | 'parent-complete';
    amount: number;
  } | null>(null);

  /**
   * 認証チェック
   */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  /**
   * 初期化処理
   */
  useEffect(() => {
    if (!user) return;

    fetchProfile();
    recoverStamina();
    fetchTasks();
    fetchGenres();

    // 定期的にスタミナ回復
    const interval = setInterval(() => {
      recoverStamina();
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [user, fetchProfile, recoverStamina, fetchTasks, fetchGenres]);

  /**
   * タスク完了処理
   */
  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      
      // クリスタル獲得アニメーション
      // TODO: 実際のクリスタル数を計算
      setRewardAnimation({ type: 'crystal', amount: 50 });
      
      showToast('タスクを完了しました！', 'success');
    } catch (error) {
      console.error('Complete task error:', error);
      showToast('タスクの完了に失敗しました', 'error');
    }
  };

  /**
   * タスク削除処理
   */
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('このタスクを削除しますか？')) return;

    try {
      await deleteTask(taskId);
      showToast('タスクを削除しました', 'info');
    } catch (error) {
      console.error('Delete task error:', error);
      showToast('タスクの削除に失敗しました', 'error');
    }
  };

  // ローディング中
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* フィルタチップ */}
        <FilterChips />

        {/* タスク一覧 */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-gray-600 text-lg">
                  タスクがありません
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  右下の ＋ ボタンから作成してください
                </p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onClick={() => {
                    // TODO: タスク詳細表示
                  }}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* クイック登録ボタン */}
      <QuickAddButtons />

      {/* 報酬獲得アニメーション */}
      <AnimatePresence>
        {rewardAnimation && (
          <RewardAnimation
            type={rewardAnimation.type}
            amount={rewardAnimation.amount}
            onComplete={() => setRewardAnimation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
