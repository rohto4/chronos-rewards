/**
 * Headerコンポーネント
 * 
 * アプリのヘッダー
 * - コイン表示
 * - クリスタル表示
 * - スタミナバー
 * - ユーザーメニュー
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserStore } from '@/lib/stores/user-store';
import { useTheme } from '@/lib/hooks/useTheme';
import { CoinDisplay } from '@/components/ui/CoinDisplay';
import { CrystalDisplay } from '@/components/ui/CrystalDisplay';
import { StaminaBar } from '@/components/ui/StaminaBar';

/**
 * Headerコンポーネント
 */
export const Header = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * ログアウト処理
   */
  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
              aria-label="メニュー"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-50">
              Chronos Rewards
            </h1>
          </div>

          {/* 報酬表示エリア */}
          <div className="flex items-center gap-4">
            {/* コイン */}
            <CoinDisplay amount={profile?.total_coins ?? 0} />

            {/* クリスタル */}
            <CrystalDisplay amount={profile?.total_crystals ?? 0} />

            {/* デスクトップ: ユーザーメニュー */}
            <div className="hidden lg:flex items-center gap-2">
              {/* テーマ切り替えボタン */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="テーマ切り替え"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="設定"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="ログアウト"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* スタミナバー */}
        <div className="pb-3">
          <StaminaBar
            current={profile?.current_stamina ?? 0}
            max={profile?.max_stamina ?? 100}
          />
        </div>
      </div>

      {/* モバイル: ドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <nav className="container mx-auto px-4 py-3 space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-900 dark:text-slate-50">ライトモード</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 dark:text-slate-50">ダークモード</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                router.push('/profile');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              <span className="text-gray-900 dark:text-slate-50">プロフィール</span>
            </button>
            <button
              onClick={() => {
                router.push('/settings');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              <span className="text-gray-900 dark:text-slate-50">設定</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span>ログアウト</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
