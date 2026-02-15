/**
 * 統計ダッシュボードページ
 *
 * タスク完了数・報酬推移・ジャンル別統計を表示
 * - 期間選択（週間・月間・年間）
 * - タスク完了数グラフ
 * - 報酬推移グラフ
 * - ジャンル別統計（円グラフ）
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, subDays, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart2, TrendingUp, PieChart as PieChartIcon, Calendar, Download } from 'lucide-react';
import { BarChart, LineChart, PieChart } from '@/components/ui/Chart';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTaskStore } from '@/lib/stores/task-store';
import { useUserStore } from '@/lib/stores/user-store';
import { exportTasksAsCSV, exportTasksAsJSON, exportStatisticsAsJSON } from '@/lib/utils/export-utils';
import type { ChartDataPoint } from '@/components/ui/Chart';

type PeriodType = 'week' | 'month' | 'year';

/**
 * 統計ダッシュボードページ
 */
export default function StatisticsPage() {
  const { tasks, fetchTasks } = useTaskStore();
  const { profile, fetchProfile } = useUserStore();
  const [period, setPeriod] = useState<PeriodType>('week');

  // データ取得
  useEffect(() => {
    fetchTasks();
    fetchProfile();
  }, [fetchTasks, fetchProfile]);

  // 期間別の完了タスク数データ
  const completionData = useMemo<ChartDataPoint[]>(() => {
    const now = new Date();
    const completedTasks = tasks.filter((task) => task.is_completed && task.completed_at);

    if (period === 'week') {
      // 過去7日間
      return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const count = completedTasks.filter((task) => {
          const completedDate = new Date(task.completed_at!);
          return format(completedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }).length;
        return {
          date: format(date, 'M/d'),
          count,
        };
      });
    } else if (period === 'month') {
      // 過去4週間
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = startOfWeek(subDays(now, (3 - i) * 7), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const count = completedTasks.filter((task) => {
          const completedDate = new Date(task.completed_at!);
          return completedDate >= weekStart && completedDate <= weekEnd;
        }).length;
        return {
          date: `第${4 - i}週`,
          count,
        };
      });
    } else {
      // 過去12ヶ月
      return Array.from({ length: 12 }, (_, i) => {
        const month = subMonths(now, 11 - i);
        const count = completedTasks.filter((task) => {
          const completedDate = new Date(task.completed_at!);
          return (
            completedDate.getFullYear() === month.getFullYear() &&
            completedDate.getMonth() === month.getMonth()
          );
        }).length;
        return {
          date: format(month, 'M月', { locale: ja }),
          count,
        };
      });
    }
  }, [tasks, period]);

  // ジャンル別タスク数データ
  const genreData = useMemo<ChartDataPoint[]>(() => {
    const completedTasks = tasks.filter((task) => task.is_completed);
    const genreCounts = new Map<string, number>();

    completedTasks.forEach((task) => {
      if (task.genre) {
        const current = genreCounts.get(task.genre.name) || 0;
        genreCounts.set(task.genre.name, current + 1);
      }
    });

    return Array.from(genreCounts.entries()).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [tasks]);

  // 統計サマリ
  const stats = {
    totalCompleted: tasks.filter((task) => task.is_completed).length,
    totalTasks: tasks.length,
    completionRate:
      tasks.length > 0
        ? Math.round((tasks.filter((task) => task.is_completed).length / tasks.length) * 100)
        : 0,
  };

  // エクスポート処理
  const handleExportCSV = () => {
    exportTasksAsCSV(tasks);
  };

  const handleExportJSON = () => {
    exportTasksAsJSON(tasks);
  };

  const handleExportStatistics = () => {
    exportStatisticsAsJSON(tasks, {
      totalCompleted: stats.totalCompleted,
      totalTasks: stats.totalTasks,
      completionRate: stats.completionRate,
      genreBreakdown: genreData.map((item) => ({
        name: item.name as string,
        count: item.value as number,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-blue-600" />
            統計ダッシュボード
          </h1>

          {/* エクスポートボタン */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportStatistics}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              統計
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 期間選択 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            週間
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            月間
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            年間
          </button>
        </div>

        {/* 統計サマリ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">完了タスク</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">総タスク数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">完了率</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* グラフエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* タスク完了数グラフ */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                タスク完了数
              </h2>
            </CardHeader>
            <CardBody>
              {completionData.length > 0 ? (
                <BarChart
                  data={completionData}
                  xKey="date"
                  yKey="count"
                  color="#3b82f6"
                  label="完了数"
                  height={250}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  データがありません
                </div>
              )}
            </CardBody>
          </Card>

          {/* ジャンル別統計 */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                ジャンル別完了タスク
              </h2>
            </CardHeader>
            <CardBody>
              {genreData.length > 0 ? (
                <PieChart
                  data={genreData}
                  nameKey="name"
                  valueKey="value"
                  height={250}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  データがありません
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
