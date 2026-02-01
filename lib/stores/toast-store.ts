/**
 * Zustand Store: Toast通知
 * 
 * トースト通知の管理
 */

import { create } from 'zustand';

/**
 * Toast型定義
 */
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number; // ミリ秒
}

/**
 * Toastストアの状態型定義
 */
interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  dismissAll: () => void;
}

/**
 * Toastストア
 * 
 * 使用例:
 * ```tsx
 * import { useToastStore } from '@/lib/stores/toast-store';
 * 
 * function Component() {
 *   const { addToast } = useToastStore();
 *   
 *   const handleClick = () => {
 *     addToast({
 *       title: '成功',
 *       description: 'タスクを作成しました',
 *       variant: 'success',
 *     });
 *   };
 * }
 * ```
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  /**
   * Toast通知を追加
   */
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    const duration = toast.duration ?? 3000; // デフォルト3秒

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // 自動削除タイマー
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  /**
   * Toast通知を削除
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  /**
   * すべてのToast通知を削除
   */
  dismissAll: () => {
    set({ toasts: [] });
  },
}));

/**
 * 便利なヘルパー関数
 */
export const toast = {
  success: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: 'success',
    });
  },
  error: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: 'destructive',
    });
  },
  info: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: 'default',
    });
  },
};
