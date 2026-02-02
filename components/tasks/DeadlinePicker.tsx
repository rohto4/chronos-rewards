/**
 * DeadlinePickerコンポーネント
 * 
 * タスク期限選択UI
 * - クイック選択（今日、明日、1週間後など）
 * - カスタム日時選択
 * - 日本語表示
 */

'use client';

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfDay, setHours, setMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

/**
 * DeadlinePickerコンポーネントのプロパティ型
 */
export interface DeadlinePickerProps {
  value: string;
  onChange: (deadline: string) => void;
}

/**
 * クイック選択オプション
 */
const QUICK_OPTIONS = [
  { label: '今日', getValue: () => setHours(setMinutes(new Date(), 0), 23) },
  { label: '明日', getValue: () => setHours(setMinutes(addDays(new Date(), 1), 0), 23) },
  { label: '3日後', getValue: () => setHours(setMinutes(addDays(new Date(), 3), 0), 23) },
  { label: '1週間後', getValue: () => setHours(setMinutes(addWeeks(new Date(), 1), 0), 23) },
  { label: '2週間後', getValue: () => setHours(setMinutes(addWeeks(new Date(), 2), 0), 23) },
  { label: '1ヶ月後', getValue: () => setHours(setMinutes(addMonths(new Date(), 1), 0), 23) },
];

/**
 * DeadlinePickerコンポーネント
 */
export const DeadlinePicker = ({ value, onChange }: DeadlinePickerProps) => {
  const [showCustom, setShowCustom] = useState(false);

  /**
   * クイック選択
   */
  const handleQuickSelect = (getDate: () => Date) => {
    const date = getDate();
    onChange(date.toISOString());
    setShowCustom(false);
  };

  /**
   * カスタム日付変更
   */
  const handleCustomDateChange = (dateString: string) => {
    if (!dateString) return;

    const currentDate = new Date(value);
    const newDate = new Date(dateString);
    
    // 既存の時刻を維持
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());
    
    onChange(newDate.toISOString());
  };

  /**
   * カスタム時刻変更
   */
  const handleCustomTimeChange = (timeString: string) => {
    if (!timeString) return;

    const currentDate = new Date(value);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);
    
    onChange(currentDate.toISOString());
  };

  const currentDate = new Date(value);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        期限
      </label>

      {/* クイック選択ボタン */}
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleQuickSelect(option.getValue)}
            className="px-4 py-2 rounded-full border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 transition-all text-sm"
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={`px-4 py-2 rounded-full border-2 transition-all text-sm ${
            showCustom
              ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium'
              : 'border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600'
          }`}
        >
          カスタム
        </button>
      </div>

      {/* 選択中の期限表示 */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Calendar className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {format(currentDate, 'yyyy年M月d日(E) HH:mm', { locale: ja })}
        </span>
      </div>

      {/* カスタム日時入力 */}
      {showCustom && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* 日付入力 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              日付
            </label>
            <input
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 時刻入力 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              時刻
            </label>
            <input
              type="time"
              value={format(currentDate, 'HH:mm')}
              onChange={(e) => handleCustomTimeChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
