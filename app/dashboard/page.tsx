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
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserStore } from '@/lib/stores/user-store';
import { useTaskStore } from '@/lib/stores/task-store';
import { useGenreStore } from '@/lib/stores/genre-store';
import { Header } from '@/components/layout/Header';
import { FilterChips } from '@/components/layout/FilterChips';
import { QuickAddButtons } from '@/components/layout/QuickAddButtons';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';

// 動的インポート: 使用頻度が低いコンポーネント
const TaskDetailModal = dynamic(
  () => import('@/components/tasks/TaskDetailModal').then(mod => ({ default: mod.TaskDetailModal })),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="text-white">読み込み中...</div>
      </div>
    ),
    ssr: false
  }
);

const RewardAnimation = dynamic(
  () => import('@/components/animations/RewardAnimation').then(mod => ({ default: mod.RewardAnimation })),
  { ssr: false }
);

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

  // タスク詳細モーダル
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  /**
   * デバッグ: 認証状態確認
   */
  useEffect(() => {
    console.log('🔐 認証状態:', {
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
    });
  }, [user, authLoading]);

  /**
   * AuthProviderのuserをuseUserStoreに設定
   */
  useEffect(() => {
    const { setUser } = useUserStore.getState();
    if (user) {
      console.log('👤 useUserStoreにユーザー設定:', user.id);
      setUser(user);
    }
  }, [user]);

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
    if (!user) {
      console.log('⚠️ ユーザー未認証のため初期化スキップ');
      return;
    }

    console.log('🚀 初期化処理開始');
    console.log('📞 fetchProfile() 呼び出し');
    fetchProfile();
    
    console.log('📞 recoverStamina() 呼び出し');
    recoverStamina();
    
    console.log('📞 fetchTasks() 呼び出し');
    fetchTasks();
    
    console.log('📞 fetchGenres() 呼び出し');
    fetchGenres();

    // 定期的にスタミナ回復
    const interval = setInterval(() => {
      recoverStamina();
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [user, fetchProfile, recoverStamina, fetchTasks, fetchGenres]);

  /**
   * デバッグ: プロフィール確認
   */
  useEffect(() => {
    console.log('🔍 プロフィール状態:', profile);
    if (profile) {
      console.log('✅ スタミナ:', profile.current_stamina, '/', profile.max_stamina);
      console.log('💰 コイン:', profile.total_coins);
      console.log('💎 クリスタル:', profile.total_crystals);
    } else {
      console.log('❌ プロフィールが未取得');
    }
  }, [profile]);

  /**
   * タスク完了処理
   */
  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await completeTask(taskId);

      // クリスタル獲得アニメーション
      if (result && result.crystalReward > 0) {
        setRewardAnimation({ type: 'crystal', amount: result.crystalReward });
      }

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
                  onClick={() => setSelectedTaskId(task.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* クイック登録ボタン */}
      <QuickAddButtons />

      {/* タスク詳細モーダル */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        onComplete={handleCompleteTask}
        onDelete={handleDeleteTask}
      />

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
