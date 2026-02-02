/**
 * UIコンポーネントテストスクリプト
 * 
 * Phase 1の基本UIコンポーネントの動作確認
 * - Button, Card, Input, Textarea
 * - Badge, Progress, Modal, Toast
 * 
 * 実行: npm run test:ui
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';

describe('UI Components - Phase 1', () => {
  describe('Button', () => {
    it('基本的なボタンがレンダリングされる', () => {
      render(<Button>クリック</Button>);
      expect(screen.getByText('クリック')).toBeInTheDocument();
    });

    it('クリックイベントが動作する', () => {
      let clicked = false;
      render(<Button onClick={() => { clicked = true; }}>クリック</Button>);
      
      fireEvent.click(screen.getByText('クリック'));
      expect(clicked).toBe(true);
    });

    it('ローディング状態で無効化される', () => {
      render(<Button isLoading>ローディング</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('バリアントが適用される', () => {
      const { container } = render(<Button variant="primary">プライマリ</Button>);
      expect(container.firstChild).toHaveClass('bg-blue-600');
    });
  });

  describe('Badge', () => {
    it('バッジがレンダリングされる', () => {
      render(<Badge>完了</Badge>);
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('バリアントが適用される', () => {
      const { container } = render(<Badge variant="success">成功</Badge>);
      expect(container.firstChild).toHaveClass('bg-green-100');
    });

    it('ドットが表示される', () => {
      const { container } = render(<Badge dot>通知</Badge>);
      const dot = container.querySelector('span span');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('Progress', () => {
    it('プログレスバーがレンダリングされる', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('正しいパーセンテージが表示される', () => {
      render(<Progress value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('値が100を超えない', () => {
      const { container } = render(<Progress value={150} />);
      const bar = container.querySelector('[role="progressbar"] > div');
      expect(bar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Input', () => {
    it('入力フィールドがレンダリングされる', () => {
      render(<Input placeholder="入力してください" />);
      expect(screen.getByPlaceholderText('入力してください')).toBeInTheDocument();
    });

    it('ラベルが表示される', () => {
      render(<Input label="ユーザー名" />);
      expect(screen.getByText('ユーザー名')).toBeInTheDocument();
    });

    it('エラーメッセージが表示される', () => {
      render(<Input error="必須項目です" />);
      expect(screen.getByText('必須項目です')).toBeInTheDocument();
    });

    it('値の変更が動作する', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Textarea', () => {
    it('テキストエリアがレンダリングされる', () => {
      render(<Textarea placeholder="詳細を入力" />);
      expect(screen.getByPlaceholderText('詳細を入力')).toBeInTheDocument();
    });

    it('文字数カウンターが表示される', () => {
      render(<Textarea value="テスト" maxLength={100} showCount />);
      expect(screen.getByText('3 / 100')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('カードがレンダリングされる', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>タイトル</CardTitle>
          </CardHeader>
          <CardBody>コンテンツ</CardBody>
          <CardFooter>フッター</CardFooter>
        </Card>
      );

      expect(screen.getByText('タイトル')).toBeInTheDocument();
      expect(screen.getByText('コンテンツ')).toBeInTheDocument();
      expect(screen.getByText('フッター')).toBeInTheDocument();
    });
  });
});

/**
 * テスト実行前の設定
 */
beforeAll(() => {
  console.log('🧪 UIコンポーネントテスト開始');
});

/**
 * テスト実行後の設定
 */
afterAll(() => {
  console.log('✅ UIコンポーネントテスト完了');
});
