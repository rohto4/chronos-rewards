/**
 * Inputコンポーネント（ダークモード対応）
 * 
 * テキスト入力フィールド
 * - バリデーションエラー表示
 * - 左右アイコン対応
 * - 無効化・読み取り専用状態
 */

import { InputHTMLAttributes, forwardRef, useId } from 'react';
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
    const generatedId = useId();
    const hasError = !!error;
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {/* ラベル */}
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        {/* 入力フィールド */}
        <div className="relative">
          {/* 左アイコン */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {leftIcon}
            </div>
          )}

          {/* インプット */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'w-full h-11 px-4 rounded-lg border transition-all duration-200',
              'bg-slate-900 text-slate-50 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-slate-950',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-700 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-600',
              disabled && 'bg-slate-800 cursor-not-allowed opacity-60',
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            aria-required={props.required}
            {...props}
          />

          {/* 右アイコン */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* エラーメッセージ */}
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* ヘルパーテキスト */}
        {!hasError && helperText && (
          <p id={helperId} className="mt-1.5 text-sm text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
