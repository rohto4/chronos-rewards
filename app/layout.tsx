/**
 * ルートレイアウト
 * 
 * Next.js App Routerのルートレイアウトコンポーネント
 * 全ページ共通のHTML構造、メタデータ、グローバルスタイルを定義
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastContainer } from '@/components/ui/toast';

/**
 * フォント設定
 * Googleフォント「Inter」を使用
 */
const inter = Inter({ subsets: ['latin'] });

/**
 * メタデータ設定
 * アプリ名、説明、OGP画像などを定義
 */
export const metadata: Metadata = {
  title: 'Chronos Rewards - タスク管理アプリ',
  description: '短期から超長期までのタスクを管理し、ゲーミフィケーション要素で楽しく達成',
  manifest: '/manifest.json',
};

/**
 * ビューポート設定
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
};

/**
 * ルートレイアウトコンポーネント
 * 
 * @param children 子コンポーネント
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-50">
            <AuthProvider>
              {children}
              {/* トースト通知コンテナ */}
              <ToastContainer />
            </AuthProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
