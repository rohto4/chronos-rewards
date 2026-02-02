/**
 * Textareaコンポーネント
 * 
 * 複数行テキスト入力フィールド
 * - 自動リサイズ対応
 * - 文字数カウンター
 * - バリデーションエラー表示
 */

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Textareaコンポーネントのプロパティ型
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

/**
 * Textareaコンポーネント
 * 
 * 使用例:
 * ```tsx
 * <Textarea
 *   label="説明"
 *   placeholder="タスクの詳細を入力"
 *   rows={4}
 *   maxLength={500}
 *   showCount
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {/* ラベル */}
        {label && (
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {/* 文字数カウンター */}
            {showCount && maxLength && (
              <span className="text-xs text-gray-500">
                {currentLength} / {maxLength}
              </span>
            )}
          </div>
        )}

        {/* テキストエリア */}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg border transition-all duration-200',
            'text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'resize-y min-h-[100px]',
            hasError
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
            className
          )}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
