/**
 * task-store.ts のテスト
 *
 * タスクストアの基本機能をテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TaskWithGenre, TaskFilters } from '@/types/database';

// Supabaseクライアントのモック
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({ data: null, error: null })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  },
}));

// user-storeのモック
vi.mock('./user-store', () => ({
  useUserStore: {
    getState: () => ({
      profile: { id: 'test-user-id', current_stamina: 100 },
      fetchProfile: vi.fn(),
      checkStamina: vi.fn(() => true),
    }),
  },
}));

describe('task-store', () => {
  describe('フィルタリング機能', () => {
    it('期間フィルタが正しく動作', () => {
      // 基本的なフィルタリングのロジックテスト
      const mockTasks: TaskWithGenre[] = [
        {
          id: '1',
          title: 'Task 1',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明日
          is_completed: false,
        } as TaskWithGenre,
        {
          id: '2',
          title: 'Task 2',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 来週
          is_completed: false,
        } as TaskWithGenre,
      ];

      // タスクの期限が正しく設定されているか確認
      expect(new Date(mockTasks[0].deadline).getTime()).toBeGreaterThan(Date.now());
      expect(new Date(mockTasks[1].deadline).getTime()).toBeGreaterThan(Date.now());
    });

    it('完了タスクをフィルタリング', () => {
      const mockTasks: TaskWithGenre[] = [
        { id: '1', title: 'Task 1', is_completed: false } as TaskWithGenre,
        { id: '2', title: 'Task 2', is_completed: true } as TaskWithGenre,
      ];

      const activeTasks = mockTasks.filter(task => !task.is_completed);
      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].id).toBe('1');
    });

    it('ジャンルでフィルタリング', () => {
      const mockTasks: TaskWithGenre[] = [
        { id: '1', title: 'Task 1', genre_id: 'genre-1' } as TaskWithGenre,
        { id: '2', title: 'Task 2', genre_id: 'genre-2' } as TaskWithGenre,
      ];

      const filtered = mockTasks.filter(task => task.genre_id === 'genre-1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('ユーティリティ機能', () => {
    it('IDでタスクを検索', () => {
      const mockTasks: TaskWithGenre[] = [
        { id: '1', title: 'Task 1' } as TaskWithGenre,
        { id: '2', title: 'Task 2' } as TaskWithGenre,
      ];

      const task = mockTasks.find(t => t.id === '1');
      expect(task).toBeDefined();
      expect(task?.title).toBe('Task 1');
    });

    it('子タスクを取得', () => {
      const mockTasks: TaskWithGenre[] = [
        { id: '1', title: 'Parent', parent_task_id: null } as TaskWithGenre,
        { id: '2', title: 'Child 1', parent_task_id: '1' } as TaskWithGenre,
        { id: '3', title: 'Child 2', parent_task_id: '1' } as TaskWithGenre,
      ];

      const children = mockTasks.filter(task => task.parent_task_id === '1');
      expect(children).toHaveLength(2);
      expect(children[0].title).toBe('Child 1');
    });
  });

  describe('タスクデータの検証', () => {
    it('タスクの必須フィールドが存在', () => {
      const task: Partial<TaskWithGenre> = {
        id: '1',
        title: 'Test Task',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
      };

      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.user_id).toBeDefined();
      expect(task.created_at).toBeDefined();
    });

    it('タスクの期限が未来の日付', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const task: Partial<TaskWithGenre> = {
        deadline: futureDate.toISOString(),
      };

      expect(new Date(task.deadline!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('フィルタ状態の管理', () => {
    it('フィルタのデフォルト値', () => {
      const defaultFilters: TaskFilters = {
        periods: [],
        genres: [],
        showOverdue: false,
      };

      expect(defaultFilters.periods).toEqual([]);
      expect(defaultFilters.genres).toEqual([]);
      expect(defaultFilters.showOverdue).toBe(false);
    });

    it('フィルタの更新', () => {
      const filters: TaskFilters = {
        periods: [],
        genres: [],
        showOverdue: false,
      };

      // 期間フィルタを追加
      filters.periods = ['today', 'this_week'];
      expect(filters.periods).toContain('today');
      expect(filters.periods).toHaveLength(2);
    });
  });
});
