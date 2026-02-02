/**
 * Badgeコンポーネント
 * 
 * ステータスやラベル表示用のバッジ
 * - 複数のカラーバリアント
 * - サイズ対応
 * - ドット表示オプション
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * バッジのスタイルバリアント定義
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-cyan-100 text-cyan-700',
        purple: 'bg-purple-100 text-purple-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * Badgeコンポーネントのプロパティ型
 */
export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

/**
 * Badgeコンポーネント
 * 
 * 使用例:
 * ```tsx
 * <Badge variant="success">完了</Badge>
 * <Badge variant="warning" dot>期限間近</Badge>
 * <Badge variant="primary" size="lg">重要</Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {/* ドット */}
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full mr-1.5',
              variant === 'primary' && 'bg-blue-600',
              variant === 'success' && 'bg-green-600',
              variant === 'warning' && 'bg-yellow-600',
              variant === 'danger' && 'bg-red-600',
              variant === 'info' && 'bg-cyan-600',
              variant === 'purple' && 'bg-purple-600',
              variant === 'default' && 'bg-gray-600'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
