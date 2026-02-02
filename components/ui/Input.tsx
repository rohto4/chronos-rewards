/**
 * Inputコンポーネント
 * 
 * テキスト入力フィールド
 * - バリデーションエラー表示
 * - 左右アイコン対応
 * - 無効化・読み取り専用状態
 */

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Inputコンポーネントのプロパティ型
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Inputコンポーネント
 * 
 * 使用例:
 * ```tsx
 * <Input
 *   label="タスク名"
 *   placeholder="タスクを入力"
 *   error="タスク名は必須です"
 *   leftIcon={<SearchIcon />}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {/* ラベル */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 入力フィールド */}
        <div className="relative">
          {/* 左アイコン */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* インプット */}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full h-11 px-4 rounded-lg border transition-all duration-200',
              'text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
              disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
              className
            )}
            disabled={disabled}
            {...props}
          />

          {/* 右アイコン */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* エラーメッセージ */}
        {hasError && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}

        {/* ヘルパーテキスト */}
        {!hasError && helperText && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
