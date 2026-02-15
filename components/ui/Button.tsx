/**
 * Buttonコンポーネント
 * 
 * アプリ全体で使用する汎用ボタン
 * - 複数のバリアント（primary, secondary, outline, ghost, danger）
 * - サイズ（sm, md, lg）
 * - ローディング状態
 * - 無効化状態
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * ボタンのスタイルバリアント定義
 */
const buttonVariants = cva(
  // 基本スタイル
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-800',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:active:bg-blue-950/50',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400 active:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-14 px-7 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * Buttonコンポーネントのプロパティ型
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Buttonコンポーネント
 * 
 * 使用例:
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   保存
 * </Button>
 * 
 * <Button variant="outline" isLoading leftIcon={<Icon />}>
 *   読み込み中
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {/* ローディングスピナー */}
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* 左アイコン */}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}

        {/* ボタンテキスト */}
        {children}

        {/* 右アイコン */}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
