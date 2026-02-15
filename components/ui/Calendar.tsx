/**
 * Calendarコンポーネント
 *
 * 月間カレンダー表示
 * - タスク数のバッジ表示
 * - 日付クリックでタスク選択
 * - 月の切り替え（前月・翌月）
 * - 今日の日付ハイライト
 */

'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskWithGenre } from '@/types/database';
import { cn } from '@/lib/utils';

/**
 * Calendarコンポーネントのプロパティ型
 */
export interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  tasks?: TaskWithGenre[];
  highlightToday?: boolean;
  className?: string;
}

/**
 * 指定日のタスク数を取得
 */
const getTaskCountForDate = (date: Date, tasks: TaskWithGenre[]): number => {
  return tasks.filter((task) => {
    const taskDeadline = new Date(task.deadline);
    return isSameDay(taskDeadline, date);
  }).length;
};

/**
 * Calendarコンポーネント
 */
export const Calendar = ({
  selectedDate,
  onDateSelect,
  tasks = [],
  highlightToday = true,
  className,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  // 月の開始日と終了日
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // カレンダーの開始日と終了日（週の開始を月曜日に設定）
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // カレンダーに表示する日付の配列
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // 前月へ移動
  const handlePreviousMonth = () => {
    setDirection('left');
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // 翌月へ移動
  const handleNextMonth = () => {
    setDirection('right');
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // 日付クリック処理
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // 曜日ラベル
  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

  // アニメーション設定
  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
      {/* ヘッダー: 月選択 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="前月"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'yyyy年M月', { locale: ja })}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="翌月"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentMonth.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="grid grid-cols-7 gap-2"
          >
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDate = highlightToday && isToday(day);
              const taskCount = getTaskCountForDate(day, tasks);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'relative aspect-square p-2 rounded-lg transition-all text-center',
                    'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    // 当月の日付
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-300',
                    // 選択中の日付
                    isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
                    // 今日の日付
                    isTodayDate && !isSelected && 'bg-blue-50 border-2 border-blue-600 font-bold',
                    // タスクがある日付
                    taskCount > 0 && !isSelected && 'font-semibold'
                  )}
                >
                  {/* 日付 */}
                  <div className="text-sm">{format(day, 'd')}</div>

                  {/* タスク数バッジ */}
                  {taskCount > 0 && (
                    <div
                      className={cn(
                        'absolute bottom-1 left-1/2 transform -translate-x-1/2',
                        'flex items-center justify-center',
                        'min-w-[18px] h-[18px] px-1 rounded-full text-xs',
                        isSelected
                          ? 'bg-white text-blue-600'
                          : 'bg-blue-600 text-white'
                      )}
                    >
                      {taskCount}
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
