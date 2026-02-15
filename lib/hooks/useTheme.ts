/**
 * useTheme フック
 *
 * テーマ（ライト/ダーク）の切り替えとlocalStorageへの永続化を管理
 * - theme state: 'light' | 'dark'
 * - toggleTheme: テーマ切り替え関数
 * - localStorage 永続化
 * - システム設定の検出
 */

'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * テーマ管理フック
 *
 * 使用例:
 * ```tsx
 * const { theme, toggleTheme } = useTheme();
 *
 * <button onClick={toggleTheme}>
 *   {theme === 'dark' ? '🌙' : '☀️'}
 * </button>
 * ```
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // 初期テーマの読み込み
  useEffect(() => {
    setMounted(true);

    // localStorage から保存されたテーマを読み込み
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    if (savedTheme) {
      // 保存されたテーマを使用
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // システム設定を検出（デフォルトはダーク）
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = prefersDark ? 'dark' : 'dark'; // デフォルトをダークに設定
      setTheme(initialTheme);
      applyTheme(initialTheme);
      localStorage.setItem('theme', initialTheme);
    }
  }, []);

  // テーマをDOMに適用
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // テーマ切り替え
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // テーマを直接設定
  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // クライアントサイドでのみレンダリング（SSRでのflashを防ぐ）
  if (!mounted) {
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
      mounted: false,
    };
  }

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    mounted: true,
  };
};
