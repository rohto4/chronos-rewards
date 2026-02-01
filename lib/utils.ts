/**
 * ユーティリティ関数
 * 
 * TailwindCSSのクラス名を条件付きで結合するための関数
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * TailwindCSSのクラス名を条件付きで結合
 * 
 * clsxとtailwind-mergeを組み合わせて、
 * 条件付きクラス名の適用と重複クラスのマージを行う
 * 
 * @param inputs クラス名（文字列、配列、オブジェクトなど）
 * @returns マージされたクラス名文字列
 * 
 * 使用例:
 * ```typescript
 * cn('px-2 py-1', isActive && 'bg-blue-500', { 'text-white': isActive })
 * // => 'px-2 py-1 bg-blue-500 text-white' (isActiveがtrueの場合)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
