/**
 * タスクコンポーネントテストスクリプト
 * 
 * Phase 3のタスク関連コンポーネントの動作確認
 * - TaskCard, TaskList, TaskForm
 * - ChecklistEditor, GenreSelector, DeadlinePicker
 * 
 * 実行: npm run test:task-components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { ChecklistEditor } from '@/components/tasks/ChecklistEditor';
import type { TaskWithGenre } from '@/types/database';

describe('Task Components - Phase 3', () => {
  describe('TaskCard', () => {
    const mockTask: TaskWithGenre = {
      id: 'task-1',
      user_id: 'user-1',
      parent_task_id: null,
      title: 'テストタスク',
      description: 'これはテストです',
      genre_id: 'genre-1',
      deadline: new Date(Date.now() + 86400000).toISOString(), // 明日
      estimated_hours: 2,
      benefits: null,
      is_completed: false,
      completed_at: null,
      completion_progress: 0,
      detail_level: 3,
      has_prerequisites: false,
      has_benefits: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      genre: {
        id: 'genre-1',
        user_id: 'user-1',
        name: '仕事',
        color: '#3B82F6',
        usage_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      checklist: [],
    };

    it('タスクカードがレンダリングされる', () => {
      const onComplete = vi.fn();
      const onDelete = vi.fn();

      render(
        <TaskCard
          task={mockTask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );

      expect(screen.getByText('テストタスク')).toBeInTheDocument();
      expect(screen.getByText('これはテストです')).toBeInTheDocument();
    });

    it('ジャンルバッジが表示される', () => {
      const onComplete = vi.fn();
      const onDelete = vi.fn();

      render(
        <TaskCard
          task={mockTask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );

      expect(screen.getByText('仕事')).toBeInTheDocument();
    });

    it('完了ボタンをクリックできる', async () => {
      const onComplete = vi.fn();
      const onDelete = vi.fn();

      render(
        <TaskCard
          task={mockTask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );

      const completeButton = screen.getByText('完了');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith('task-1');
      });
    });

    it('削除ボタンをクリックできる', async () => {
      const onComplete = vi.fn();
      const onDelete = vi.fn();

      render(
        <TaskCard
          task={mockTask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByLabelText('削除');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('task-1');
      });
    });

    it('期限切れタスクは正しく表示される', () => {
      const overdueTask = {
        ...mockTask,
        deadline: new Date(Date.now() - 86400000).toISOString(), // 昨日
      };

      const onComplete = vi.fn();
      const onDelete = vi.fn();

      render(
        <TaskCard
          task={overdueTask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );

      expect(screen.getByText('期限切れ')).toBeInTheDocument();
    });

    it('完了済みタスクは打ち消し線が表示される', () => {
      const completedTask = {
        ...mockTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      };

      const onComplete = vi.fn();
      const onDelete = vi.fn();

      const { container } = render(
        <TaskCard
          task={completedTask}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      );

      const title = container.querySelector('h3');
      expect(title).toHaveClass('line-through');
    });
  });

  describe('ChecklistEditor', () => {
    it('チェックリストエディタがレンダリングされる', () => {
      const onChange = vi.fn();
      
      render(<ChecklistEditor items={[]} onChange={onChange} />);
      
      expect(screen.getByPlaceholderText('チェックリスト項目を入力')).toBeInTheDocument();
    });

    it('アイテムを追加できる', async () => {
      const onChange = vi.fn();
      
      render(<ChecklistEditor items={[]} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('チェックリスト項目を入力');
      const addButton = screen.getByText('追加');

      fireEvent.change(input, { target: { value: '新しい項目' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(['新しい項目']);
      });
    });

    it('既存アイテムが表示される', () => {
      const onChange = vi.fn();
      const items = ['項目1', '項目2', '項目3'];
      
      render(<ChecklistEditor items={items} onChange={onChange} />);
      
      expect(screen.getByText('項目1')).toBeInTheDocument();
      expect(screen.getByText('項目2')).toBeInTheDocument();
      expect(screen.getByText('項目3')).toBeInTheDocument();
    });

    it('アイテムを削除できる', async () => {
      const onChange = vi.fn();
      const items = ['項目1', '項目2'];
      
      render(<ChecklistEditor items={items} onChange={onChange} />);
      
      // 最初の削除ボタンをクリック
      const deleteButtons = screen.getAllByLabelText('削除');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(['項目2']);
      });
    });
  });
});

/**
 * テスト実行前の設定
 */
beforeAll(() => {
  console.log('🧪 タスクコンポーネントテスト開始');
});

/**
 * テスト実行後の設定
 */
afterAll(() => {
  console.log('✅ タスクコンポーネントテスト完了');
});
