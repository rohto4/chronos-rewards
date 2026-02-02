/**
 * Progressコンポーネント
 * 
 * 進捗状況を視覚的に表示するプログレスバー
 * - パーセンテージ表示
 * - カラーバリアント
 * - アニメーション対応
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * プログレスバーのスタイルバリアント定義
 */
const progressVariants = cva('h-full rounded-full transition-all duration-500', {
  variants: {
    variant: {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      danger: 'bg-red-600',
      purple: 'bg-purple-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Progressコンポーネントのプロパティ型
 */
export interface ProgressProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Progressコンポーネント
 * 
 * 使用例:
 * ```tsx
 * <Progress value={75} variant="success" showLabel />
 * <Progress value={30} variant="warning" size="lg" />
 * ```
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      variant,
      value,
      max = 100,
      showLabel = false,
      size = 'md',
      ...props
    },
    ref
  ) => {
    // パーセンテージを計算（0-100に制限）
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // サイズクラス
    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    };

    return (
      <div className="w-full">
        {/* ラベル */}
        {showLabel && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">進捗</span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(percentage)}%
            </span>
          </div>
        )}

        {/* プログレスバー */}
        <div
          ref={ref}
          className={cn(
            'w-full bg-gray-200 rounded-full overflow-hidden',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(progressVariants({ variant }))}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';
