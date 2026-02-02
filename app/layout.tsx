/**
 * ルートレイアウト
 * 
 * Next.js App Routerのルートレイアウトコンポーネント
 * 全ページ共通のHTML構造、メタデータ、グローバルスタイルを定義
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
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
  themeColor: '#3B82F6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
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
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <AuthProvider>
            {children}
            {/* トースト通知コンテナ */}
            <ToastContainer />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
