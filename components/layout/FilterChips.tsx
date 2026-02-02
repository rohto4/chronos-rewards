/**
 * FilterChipsコンポーネント
 * 
 * タスクフィルタリング用のチップUI
 * - 期間フィルタ
 * - ジャンルフィルタ
 * - 期限切れ表示切替
 */

'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '@/lib/stores/task-store';
import { useGenreStore } from '@/lib/stores/genre-store';
import type { FilterPeriod } from '@/types/database';

/**
 * 期間フィルタのラベル
 */
const PERIOD_LABELS: Record<FilterPeriod, string> = {
  today: '今日',
  this_week: '今週',
  two_weeks: '2週間',
  one_month: '1ヶ月',
  three_months: '3ヶ月',
  one_year: '1年',
  three_years: '3年',
};

/**
 * FilterChipsコンポーネント
 */
export const FilterChips = () => {
  const {
    filters,
    togglePeriodFilter,
    toggleGenreFilter,
    setFilters,
  } = useTaskStore();
  const { genres, fetchGenres } = useGenreStore();

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  /**
   * 期限切れトグル
   */
  const handleToggleOverdue = () => {
    setFilters({ showOverdue: !filters.showOverdue });
  };

  /**
   * フィルタクリア
   */
  const handleClearFilters = () => {
    setFilters({
      periods: ['this_week'],
      showOverdue: false,
      genres: [],
    });
  };

  const hasActiveFilters =
    filters.periods.length > 1 ||
    (filters.periods.length === 1 && filters.periods[0] !== 'this_week') ||
    filters.showOverdue ||
    filters.genres.length > 0;

  return (
    <div className="space-y-3">
      {/* 期間フィルタ */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">期間</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as FilterPeriod[]).map((period) => {
            const isSelected = filters.periods.includes(period);
            return (
              <button
                key={period}
                onClick={() => togglePeriodFilter(period)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {PERIOD_LABELS[period]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ジャンルフィルタ */}
      {genres.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">ジャンル</h3>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const isSelected = filters.genres.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  onClick={() => toggleGenreFilter(genre.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isSelected ? genre.color : '#F3F4F6',
                    color: isSelected ? 'white' : genre.color,
                    borderWidth: isSelected ? 0 : 2,
                    borderColor: genre.color,
                  }}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* オプション */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleToggleOverdue}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filters.showOverdue
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <input
            type="checkbox"
            checked={filters.showOverdue}
            onChange={handleToggleOverdue}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span>期限切れを表示</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>クリア</span>
          </button>
        )}
      </div>
    </div>
  );
};
