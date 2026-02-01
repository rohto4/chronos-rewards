/**
 * 日付ユーティリティ関数
 * 
 * date-fnsをラップした日付処理関数群
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  differenceInDays,
  differenceInHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付を読みやすい形式でフォーマット
 * 
 * @param date 日付文字列またはDateオブジェクト
 * @returns フォーマット済み文字列（例: '2026/01/31'）
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'yyyy/MM/dd', { locale: ja });
}

/**
 * 日付と時刻を読みやすい形式でフォーマット
 * 
 * @param date 日付文字列またはDateオブジェクト
 * @returns フォーマット済み文字列（例: '2026/01/31 15:30'）
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: ja });
}

/**
 * 相対的な時間表現を取得
 * 「3日後」「2時間前」など
 * 
 * @param date 日付文字列またはDateオブジェクト
 * @returns 相対時間（例: '3日後'）
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ja,
  });
}

/**
 * タスクの期限を表示用にフォーマット
 * 今日・明日・昨日などは特別な表記に
 * 
 * @param deadline 期限日時
 * @returns 表示用文字列（例: '今日', '明日', '2026/02/01'）
 */
export function formatDeadline(deadline: string | Date): string {
  const date = new Date(deadline);

  if (isToday(date)) {
    return '今日';
  }
  if (isTomorrow(date)) {
    return '明日';
  }
  if (isYesterday(date)) {
    return '昨日';
  }

  // 7日以内なら「○日後」表記
  const daysUntil = differenceInDays(date, new Date());
  if (daysUntil > 0 && daysUntil <= 7) {
    return `${daysUntil}日後`;
  }

  // それ以外は日付表記
  return formatDate(date);
}

/**
 * 期限の緊急度を判定
 * 
 * @param deadline 期限日時
 * @returns 緊急度（'overdue' | 'urgent' | 'soon' | 'normal'）
 */
export function getDeadlineUrgency(
  deadline: string | Date
): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const date = new Date(deadline);
  const now = new Date();

  // 期限切れ
  if (isPast(date)) {
    return 'overdue';
  }

  // 24時間以内
  const hoursUntil = differenceInHours(date, now);
  if (hoursUntil <= 24) {
    return 'urgent';
  }

  // 3日以内
  const daysUntil = differenceInDays(date, now);
  if (daysUntil <= 3) {
    return 'soon';
  }

  return 'normal';
}

/**
 * 緊急度に応じたカラークラスを取得
 * 
 * @param deadline 期限日時
 * @returns Tailwindカラークラス
 */
export function getDeadlineColor(deadline: string | Date): string {
  const urgency = getDeadlineUrgency(deadline);

  switch (urgency) {
    case 'overdue':
      return 'text-red-500';
    case 'urgent':
      return 'text-orange-500';
    case 'soon':
      return 'text-yellow-500';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * 期限が過ぎているかチェック
 * 
 * @param deadline 期限日時
 * @returns 期限切れならtrue
 */
export function isOverdue(deadline: string | Date): boolean {
  return isPast(new Date(deadline));
}

/**
 * 指定日数後の日付を取得
 * 
 * @param days 日数
 * @returns 日付
 */
export function getDateAfterDays(days: number): Date {
  return addDays(new Date(), days);
}

/**
 * 指定週数後の日付を取得
 * 
 * @param weeks 週数
 * @returns 日付
 */
export function getDateAfterWeeks(weeks: number): Date {
  return addWeeks(new Date(), weeks);
}

/**
 * 指定月数後の日付を取得
 * 
 * @param months 月数
 * @returns 日付
 */
export function getDateAfterMonths(months: number): Date {
  return addMonths(new Date(), months);
}

/**
 * 指定年数後の日付を取得
 * 
 * @param years 年数
 * @returns 日付
 */
export function getDateAfterYears(years: number): Date {
  return addYears(new Date(), years);
}

/**
 * 日付をISO 8601形式の文字列に変換
 * Supabaseへの保存時に使用
 * 
 * @param date Dateオブジェクト
 * @returns ISO 8601形式の文字列
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * 今日の開始時刻を取得
 * 
 * @returns 今日の0時0分0秒
 */
export function getTodayStart(): Date {
  return startOfDay(new Date());
}

/**
 * 今日の終了時刻を取得
 * 
 * @returns 今日の23時59分59秒
 */
export function getTodayEnd(): Date {
  return endOfDay(new Date());
}
