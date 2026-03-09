/**
 * 新規登録ページ
 * 
 * メールアドレスとパスワードでアカウント作成
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * バリデーション
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 新規登録処理
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const { error, needsEmailConfirmation, data } = await signUp(email, password);

      if (error) {
        throw error;
      }

      // セッションが作成された場合（メール確認不要）
      if (data?.session) {
        showToast('アカウントを作成しました！', 'success');
        router.push('/dashboard');
      }
      // メール確認が必要な場合
      else if (needsEmailConfirmation) {
        showToast('アカウントを作成しました', 'success', {
          description: '開発環境のため、メール確認なしでログインできます。ログイン画面で同じメールアドレスとパスワードでログインしてください。',
        });
        // 2秒後にログインページへ
        setTimeout(() => router.push('/login'), 3000);
      }
      // その他の場合
      else {
        showToast('アカウントを作成しました！', 'success');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // エラーメッセージの解析
      let errorMessage = 'アカウントの作成に失敗しました';
      
      if (error.message?.includes('already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = '有効なメールアドレスを入力してください';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'パスワードは6文字以上で入力してください';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* カード */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chronos Rewards
            </h1>
            <p className="text-gray-600">
              新規アカウント登録
            </p>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* メールアドレス */}
            <Input
              label="メールアドレス"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            {/* パスワード */}
            <Input
              label="パスワード"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              helperText="6文字以上"
              required
            />

            {/* パスワード（確認） */}
            <Input
              label="パスワード（確認）"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              required
            />

            {/* 登録ボタン */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              新規登録
            </Button>

            {/* ログインリンク */}
            <p className="text-center text-sm text-gray-600 mt-4">
              アカウントをお持ちの方は{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ログイン
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
