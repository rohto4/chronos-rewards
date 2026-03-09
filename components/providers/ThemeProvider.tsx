/**
 * ThemeProvider コンポーネント
 *
 * テーマ（ライト/ダーク）の切り替えを管理するプロバイダー
 * - useThemeフックを使用してテーマを管理
 * - HTML要素にdarkクラスを動的に適用
 * - localStorage で永続化
 */

'use client';

import { useEffect } from 'react';

/**
 * ThemeProvider コンポーネント
 *
 * 初期レンダリング時にlocalStorageからテーマを読み込み、
 * HTML要素にdarkクラスを適用する
 *
 * suppressHydrationWarning により、SSRとCSRのHTML差異を許容
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // クライアント側でのみ実行される
    // localStorage から保存されたテーマを読み込み
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
      // ライトモードに切り替え
      document.documentElement.classList.remove('dark');
    } else {
      // ダークモードに切り替え（デフォルト）
      document.documentElement.classList.add('dark');

      // テーマが保存されていない場合はダークをデフォルトとして保存
      if (!savedTheme) {
        localStorage.setItem('theme', 'dark');
      }
    }
  }, []);

  return <>{children}</>;
};
