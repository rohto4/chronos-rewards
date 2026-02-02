/**
 * StaminaBarコンポーネント
 * 
 * スタミナ残量を視覚的に表示
 * - プログレスバー
 * - 回復時間表示
 * - アニメーション対応
 */

'use client';

import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * StaminaBarコンポーネントのプロパティ型
 */
export interface StaminaBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  showRecoveryTime?: boolean;
}

/**
 * StaminaBarコンポーネント
 */
export const StaminaBar = ({
  current,
  max,
  showLabel = true,
  showRecoveryTime = false,
}: StaminaBarProps) => {
  /**
   * スタミナパーセンテージ計算
   */
  const percentage = useMemo(() => {
    return Math.min(Math.max((current / max) * 100, 0), 100);
  }, [current, max]);

  /**
   * 色の決定
   */
  const barColor = useMemo(() => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [percentage]);

  const textColor = useMemo(() => {
    if (percentage >= 70) return 'text-green-700';
    if (percentage >= 30) return 'text-yellow-700';
    return 'text-red-700';
  }, [percentage]);

  /**
   * 次回回復までの時間計算（仮実装）
   */
  const recoveryTime = useMemo(() => {
    if (current >= max) return null;
    // 1分で1ポイント回復と仮定
    const remainingMinutes = max - current;
    if (remainingMinutes < 60) {
      return `${remainingMinutes}分`;
    }
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}時間${minutes > 0 ? `${minutes}分` : ''}`;
  }, [current, max]);

  return (
    <div className="space-y-1.5">
      {/* ラベルとスタミナ値 */}
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-gray-700">スタミナ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${textColor}`}>
              {current} / {max}
            </span>
            {showRecoveryTime && recoveryTime && (
              <span className="text-xs text-gray-500">
                ({recoveryTime}で回復)
              </span>
            )}
          </div>
        </div>
      )}

      {/* プログレスバー */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* パルスエフェクト（低スタミナ時） */}
        {percentage < 30 && (
          <motion.div
            className="absolute inset-0 bg-red-400 rounded-full opacity-30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>

      {/* 警告メッセージ */}
      {percentage < 30 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-600 font-medium"
        >
          ⚠ スタミナが不足しています
        </motion.p>
      )}
    </div>
  );
};
