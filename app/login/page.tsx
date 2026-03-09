/**
 * ログインページ
 * 
 * メールアドレス・パスワードでのログイン
 * - バリデーション
 * - エラーハンドリング
 * - サインアップへのリンク
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  /**
   * フォームバリデーション
   */
  const validate = () => {
    const newErrors: typeof errors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * ログイン処理
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Login failed:', error);

        // エラーメッセージを詳細に表示
        let errorMessage = 'ログインに失敗しました';
        let description = error.message;

        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
          description = 'Supabaseでメール確認が必要な可能性があります。ダッシュボードで確認してください。';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスが未確認です';
          description = '確認メールのリンクをクリックしてください';
        }

        showToast(errorMessage, 'error', { description });
        return;
      }

      showToast('ログインしました', 'success');
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      showToast('予期しないエラーが発生しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Chronos Rewards
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            タスク管理でクリスタルを集めよう
          </p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* メールアドレス */}
            <Input
              label="メールアドレス"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-5 h-5" />}
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
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            {/* ログインボタン */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-5 h-5" />}
            >
              ログイン
            </Button>

            {/* サインアップリンク */}
            <div className="text-center text-sm">
              <span className="text-gray-600">アカウントをお持ちでない方は </span>
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                新規登録
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
