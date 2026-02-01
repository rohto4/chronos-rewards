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
import { ToastProvider } from '@/components/ui/toast';

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
  // PWA用マニフェスト（後で追加）
  // manifest: '/manifest.json',
  themeColor: '#0F172A', // ダークモードの背景色
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
    <html lang="ja" className="dark">
      <body className={inter.className}>
        {/* 
          ダークモード専用のため、常にdarkクラスを付与
          背景色とテキスト色をTailwindのグローバルCSSで設定
        */}
        <div className="min-h-screen bg-background text-foreground">
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
