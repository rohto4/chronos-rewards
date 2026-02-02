/**
 * ChecklistEditorコンポーネント
 * 
 * タスクのチェックリスト編集
 * - アイテム追加・削除
 * - ドラッグ&ドロップ並び替え
 * - チェック状態管理
 */

'use client';

import { useState, KeyboardEvent } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * ChecklistEditorコンポーネントのプロパティ型
 */
export interface ChecklistEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

/**
 * ChecklistEditorコンポーネント
 */
export const ChecklistEditor = ({ items, onChange }: ChecklistEditorProps) => {
  const [inputValue, setInputValue] = useState('');

  /**
   * アイテム追加
   */
  const handleAdd = () => {
    if (!inputValue.trim()) return;

    onChange([...items, inputValue.trim()]);
    setInputValue('');
  };

  /**
   * Enterキーで追加
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  /**
   * アイテム削除
   */
  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  /**
   * アイテム並び替え
   */
  const handleMove = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        チェックリスト（前提条件）
      </label>

      {/* 既存アイテム一覧 */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* ドラッグハンドル */}
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                aria-label="並び替え"
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* アイテムテキスト */}
              <span className="flex-1 text-sm text-gray-900">{item}</span>

              {/* 削除ボタン */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
                aria-label="削除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 新規アイテム入力 */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder="チェックリスト項目を入力"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          追加
        </Button>
      </div>

      {/* ヘルパーテキスト */}
      <p className="text-xs text-gray-500">
        タスク完了の前提条件となる項目を追加してください
      </p>
    </div>
  );
};
