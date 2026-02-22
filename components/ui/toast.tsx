/**
 * Toastコンポーネント
 * 
 * 一時的な通知メッセージを表示
 * - 成功/エラー/警告/情報の4種類
 * - 自動消滅
 * - スワイプで閉じる
 * - アニメーション対応
 */

'use client';

import { useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useToastStore, type Toast } from '@/lib/stores/toast-store';
import { cn } from '@/lib/utils';

/**
 * 個別のToastアイテム
 */
const ToastItem = forwardRef<HTMLDivElement, { toast: Toast }>(({ toast }, ref) => {
  const { removeToast } = useToastStore();

  // アイコンとカラー
  const config = {
    success: {
      icon: CheckCircle,
      bgClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-600',
      textClass: 'text-green-900',
    },
    error: {
      icon: XCircle,
      bgClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-600',
      textClass: 'text-red-900',
    },
    warning: {
      icon: AlertTriangle,
      bgClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-600',
      textClass: 'text-yellow-900',
    },
    info: {
      icon: Info,
      bgClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-600',
      textClass: 'text-blue-900',
    },
  };

  const { icon: Icon, bgClass, iconClass, textClass } = config[toast.type];

  // スワイプで閉じる
  const handlers = useSwipeable({
    onSwipedRight: () => removeToast(toast.id),
    trackMouse: true,
  });

  // handlersからrefを除外（forwardRefのrefと競合するため）
  const { ref: _swipeRef, ...swipeHandlers } = handlers;

  // 自動消滅
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      {...swipeHandlers}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm',
        bgClass
      )}
    >
      {/* アイコン */}
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', iconClass)} />

      {/* メッセージ */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', textClass)}>{toast.message}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-gray-600">{toast.description}</p>
        )}
      </div>

      {/* 閉じるボタン */}
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="閉じる"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </motion.div>
  );
});

ToastItem.displayName = 'ToastItem';

/**
 * Toastコンテナ
 * 
 * アプリのルートレイアウトに配置
 */
export const ToastContainer = () => {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Toastフック
 * 
 * 使用例:
 * ```tsx
 * const { showToast } = useToast();
 * 
 * showToast('タスクを作成しました', 'success');
 * showToast('エラーが発生しました', 'error', { description: '詳細メッセージ' });
 * ```
 */
export const useToast = () => {
  const { addToast } = useToastStore();

  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    options?: {
      description?: string;
      duration?: number;
    }
  ) => {
    addToast({
      message,
      type,
      description: options?.description,
      duration: options?.duration,
    });
  };

  return { showToast };
};
