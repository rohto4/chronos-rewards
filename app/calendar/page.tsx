/**
 * カレンダービューページ
 *
 * 月間カレンダーと選択日のタスク一覧を表示
 * - Calendar コンポーネントの統合
 * - 選択日のタスク一覧表示
 * - 月間統計（完了数・獲得報酬）
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { Calendar as CalendarIcon, CheckCircle, Coins, Gem } from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTaskStore } from '@/lib/stores/task-store';
import { useUserStore } from '@/lib/stores/user-store';
import type { TaskWithGenre } from '@/types/database';

// 動的インポート: Calendarコンポーネント
const Calendar = dynamic(
  () => import('@/components/ui/Calendar').then(mod => ({ default: mod.Calendar })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">カレンダーを読み込み中...</div>
      </div>
    ),
    ssr: false
  }
);

/**
 * カレンダービューページ
 */
export default function CalendarPage() {
  const { tasks, fetchTasks, completeTask, deleteTask } = useTaskStore();
  const { profile, fetchProfile } = useUserStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<TaskWithGenre[]>([]);

  // タスクとプロフィールを取得
  useEffect(() => {
    fetchTasks();
    fetchProfile();
  }, [fetchTasks, fetchProfile]);

  // 選択日のタスクをフィルタリング
  useEffect(() => {
    const filteredTasks = tasks.filter((task) => {
      const taskDeadline = new Date(task.deadline);
      return (
        taskDeadline.getFullYear() === selectedDate.getFullYear() &&
        taskDeadline.getMonth() === selectedDate.getMonth() &&
        taskDeadline.getDate() === selectedDate.getDate()
      );
    });
    setSelectedDateTasks(filteredTasks);
  }, [tasks, selectedDate]);

  // タスク完了処理
  const handleComplete = async (taskId: string) => {
    await completeTask(taskId);
  };

  // タスク削除処理
  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
  };

  // 当月の統計を計算
  const monthStats = {
    completed: tasks.filter(
      (task) =>
        task.is_completed &&
        task.completed_at &&
        new Date(task.completed_at).getMonth() === selectedDate.getMonth() &&
        new Date(task.completed_at).getFullYear() === selectedDate.getFullYear()
    ).length,
    total: tasks.filter(
      (task) =>
        new Date(task.deadline).getMonth() === selectedDate.getMonth() &&
        new Date(task.deadline).getFullYear() === selectedDate.getFullYear()
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            カレンダー
          </h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: カレンダー + 月間統計 */}
          <div className="lg:col-span-2 space-y-6">
            {/* カレンダー */}
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              tasks={tasks}
              highlightToday
            />

            {/* 月間統計 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'yyyy年M月', { locale: ja })} の統計
                </h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  {/* 完了率 */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">完了率</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {monthStats.total > 0
                        ? Math.round((monthStats.completed / monthStats.total) * 100)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {monthStats.completed} / {monthStats.total} タスク
                    </p>
                  </div>

                  {/* 獲得報酬（プレースホルダー） */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gem className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">獲得報酬</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span>コイン: -</span>
                      </p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Gem className="w-4 h-4 text-purple-600" />
                        <span>クリスタル: -</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 右側: 選択日のタスク一覧 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'M月d日(E)', { locale: ja })} のタスク
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDateTasks.length}件のタスク
                </p>
              </CardHeader>
              <CardBody>
                {selectedDateTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">この日のタスクはありません</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                        onClick={() => {
                          // タスク詳細表示（TaskDetailModal を開く）
                          // TODO: TaskDetailModal の統合
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
