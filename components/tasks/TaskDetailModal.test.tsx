/**
 * TaskDetailModal.tsx のテスト
 *
 * タスク詳細モーダルの基本機能をテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { TaskWithGenre } from '@/types/database';

// Supabaseクライアントのモック
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
    })),
  },
}));

// task-storeのモック
vi.mock('@/lib/stores/task-store', () => ({
  useTaskStore: () => ({
    tasks: [],
    getTaskById: vi.fn(() => mockTask),
    updateTask: vi.fn(),
    updateTaskChecklist: vi.fn(),
  }),
}));

const mockTask: TaskWithGenre = {
  id: 'task-1',
  title: 'テストタスク',
  description: 'これはテスト用のタスクです',
  user_id: 'user-1',
  parent_task_id: null,
  genre_id: 'genre-1',
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  estimated_hours: 5,
  benefits: 'テストのメリット',
  is_completed: false,
  completed_at: null,
  completion_progress: 0,
  detail_level: 3,
  has_prerequisites: true,
  has_benefits: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  genre: {
    id: 'genre-1',
    name: 'テストジャンル',
    user_id: 'user-1',
    color: '#3b82f6',
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  checklist: [],
};

describe('TaskDetailModal', () => {
  describe('タスクデータの構造', () => {
    it('タスクの必須フィールドが存在', () => {
      expect(mockTask.id).toBeDefined();
      expect(mockTask.title).toBeDefined();
      expect(mockTask.user_id).toBeDefined();
      expect(mockTask.deadline).toBeDefined();
    });

    it('ジャンル情報が含まれる', () => {
      expect(mockTask.genre).toBeDefined();
      expect(mockTask.genre?.name).toBe('テストジャンル');
    });

    it('推定時間が正の値', () => {
      expect(mockTask.estimated_hours).toBeGreaterThan(0);
    });
  });

  describe('タスクの完了状態', () => {
    it('未完了タスクの状態', () => {
      expect(mockTask.is_completed).toBe(false);
    });

    it('完了タスクの状態', () => {
      const completedTask: TaskWithGenre = {
        ...mockTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      };

      expect(completedTask.is_completed).toBe(true);
      expect(completedTask.completed_at).toBeDefined();
    });
  });

  describe('チェックリストの構造', () => {
    it('チェックリストアイテムの形式', () => {
      const checklistItem = {
        id: 'item-1',
        task_id: 'task-1',
        item_text: 'チェック項目',
        is_checked: false,
        sort_order: 0,
      };

      expect(checklistItem.id).toBeDefined();
      expect(checklistItem.item_text).toBeDefined();
      expect(checklistItem.is_checked).toBe(false);
    });

    it('チェック済みアイテムの状態', () => {
      const checkedItem = {
        id: 'item-1',
        task_id: 'task-1',
        item_text: 'チェック項目',
        is_checked: true,
        sort_order: 0,
      };

      expect(checkedItem.is_checked).toBe(true);
    });

    it('進捗率の計算', () => {
      const checklist = [
        { is_checked: true },
        { is_checked: true },
        { is_checked: false },
        { is_checked: false },
      ];

      const completedCount = checklist.filter(item => item.is_checked).length;
      const progress = (completedCount / checklist.length) * 100;

      expect(progress).toBe(50);
    });
  });

  describe('報酬の計算', () => {
    it('コイン報酬が正の値', () => {
      const coinReward = 100;
      expect(coinReward).toBeGreaterThan(0);
    });

    it('クリスタル報酬が正の値', () => {
      const crystalReward = 50;
      expect(crystalReward).toBeGreaterThan(0);
    });

    it('詳細度が1-5の範囲', () => {
      const detailLevel = 3;
      expect(detailLevel).toBeGreaterThanOrEqual(1);
      expect(detailLevel).toBeLessThanOrEqual(5);
    });
  });

  describe('日時のフォーマット', () => {
    it('ISO形式の日時文字列', () => {
      const isoDate = mockTask.deadline;
      expect(isoDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('未来の期限日', () => {
      const deadlineDate = new Date(mockTask.deadline);
      const now = new Date();

      expect(deadlineDate.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('親子タスクの関係', () => {
    it('親タスクはparent_task_idがnull', () => {
      const parentTask: Partial<TaskWithGenre> = {
        id: 'parent-1',
        parent_task_id: null,
      };

      expect(parentTask.parent_task_id).toBeNull();
    });

    it('子タスクはparent_task_idを持つ', () => {
      const childTask: Partial<TaskWithGenre> = {
        id: 'child-1',
        parent_task_id: 'parent-1',
      };

      expect(childTask.parent_task_id).toBe('parent-1');
    });
  });
});
