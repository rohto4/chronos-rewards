/**
 * TaskFormコンポーネント
 * 
 * タスク作成・編集用フォーム
 * - 全項目入力対応
 * - バリデーション
 * - チェックリスト編集
 * - ジャンル選択
 * - 期限選択
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { TaskInsert, TaskUpdate, TaskWithGenre } from '@/types/database';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ChecklistEditor } from './ChecklistEditor';
import { GenreSelector } from './GenreSelector';
import { DeadlinePicker } from './DeadlinePicker';
import { useUserStore } from '@/lib/stores/user-store';

/**
 * TaskFormコンポーネントのプロパティ型
 */
export interface TaskFormProps {
  task?: TaskWithGenre | null;
  onSubmit: (task: TaskInsert | TaskUpdate) => Promise<void>;
  onCancel: () => void;
}

/**
 * TaskFormコンポーネント
 */
export const TaskForm = ({ task, onSubmit, onCancel }: TaskFormProps) => {
  const { profile } = useUserStore();

  // フォーム状態
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [genreId, setGenreId] = useState(task?.genre_id ?? null);
  const [deadline, setDeadline] = useState(
    task?.deadline ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimated_hours?.toString() ?? '1'
  );
  const [benefits, setBenefits] = useState(task?.benefits ?? '');
  const [detailLevel, setDetailLevel] = useState(task?.detail_level ?? 3);
  const [checklist, setChecklist] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * バリデーション
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    }

    if (!deadline) {
      newErrors.deadline = '期限を選択してください';
    }

    const hours = parseFloat(estimatedHours);
    if (isNaN(hours) || hours <= 0) {
      newErrors.estimatedHours = '有効な時間を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * フォーム送信
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!profile) return;

    setIsLoading(true);

    try {
      const taskData: TaskInsert | TaskUpdate = {
        title: title.trim(),
        description: description.trim() || null,
        genre_id: genreId,
        deadline,
        estimated_hours: parseFloat(estimatedHours),
        benefits: benefits.trim() || null,
        detail_level: detailLevel,
        has_prerequisites: checklist.length > 0,
        has_benefits: !!benefits.trim(),
        ...(task ? {} : { user_id: profile.id }),
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* タイトル */}
      <Input
        label="タイトル"
        placeholder="タスク名を入力"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        required
      />

      {/* 説明 */}
      <Textarea
        label="説明"
        placeholder="タスクの詳細を入力（任意）"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        maxLength={500}
        showCount
      />

      {/* ジャンル選択 */}
      <GenreSelector value={genreId} onChange={setGenreId} />

      {/* 期限選択 */}
      <DeadlinePicker value={deadline} onChange={setDeadline} />

      {/* 見積時間 */}
      <Input
        label="見積時間（時間）"
        type="number"
        placeholder="1"
        value={estimatedHours}
        onChange={(e) => setEstimatedHours(e.target.value)}
        error={errors.estimatedHours}
        min="0.5"
        step="0.5"
        required
      />

      {/* 詳細レベル */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          詳細レベル
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDetailLevel(level)}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                detailLevel === level
                  ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          1: 簡易 ← → 5: 詳細
        </p>
      </div>

      {/* ベネフィット */}
      <Textarea
        label="ベネフィット（得られるもの）"
        placeholder="このタスクを完了することで得られるもの（任意）"
        value={benefits}
        onChange={(e) => setBenefits(e.target.value)}
        rows={2}
        maxLength={300}
        showCount
      />

      {/* チェックリスト */}
      <ChecklistEditor items={checklist} onChange={setChecklist} />

      {/* アクションボタン */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1"
          isLoading={isLoading}
        >
          {task ? '更新' : '作成'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
};
