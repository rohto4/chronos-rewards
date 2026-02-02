/**
 * GenreSelectorコンポーネント
 * 
 * タスクジャンル選択UI
 * - カラーピッカー
 * - 新規ジャンル作成
 * - 使用頻度順表示
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { useGenreStore } from '@/lib/stores/genre-store';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * GenreSelectorコンポーネントのプロパティ型
 */
export interface GenreSelectorProps {
  value: string | null;
  onChange: (genreId: string | null) => void;
}

/**
 * プリセットカラー
 */
const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

/**
 * GenreSelectorコンポーネント
 */
export const GenreSelector = ({ value, onChange }: GenreSelectorProps) => {
  const { genres, fetchGenres, createGenre } = useGenreStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  /**
   * 新規ジャンル作成
   */
  const handleCreateGenre = async () => {
    if (!newGenreName.trim()) return;

    setIsCreating(true);

    try {
      const newGenre = await createGenre({
        name: newGenreName.trim(),
        color: selectedColor,
      });

      if (newGenre) {
        onChange(newGenre.id);
        setIsModalOpen(false);
        setNewGenreName('');
        setSelectedColor(PRESET_COLORS[0]);
      }
    } catch (error) {
      console.error('Create genre error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        ジャンル
      </label>

      {/* ジャンル選択チップ */}
      <div className="flex flex-wrap gap-2">
        {/* 未選択オプション */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`px-4 py-2 rounded-full border-2 transition-all ${
            value === null
              ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium'
              : 'border-gray-300 hover:border-gray-400 text-gray-700'
          }`}
        >
          なし
        </button>

        {/* 既存ジャンル */}
        {genres.map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => onChange(genre.id)}
            className="relative px-4 py-2 rounded-full border-2 transition-all"
            style={{
              borderColor: value === genre.id ? genre.color : '#E5E7EB',
              backgroundColor: value === genre.id ? `${genre.color}20` : 'white',
              color: value === genre.id ? genre.color : '#374151',
            }}
          >
            {genre.name}
            {value === genre.id && (
              <Check className="inline-block w-4 h-4 ml-1" />
            )}
          </button>
        ))}

        {/* 新規作成ボタン */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 transition-all"
        >
          <Plus className="inline-block w-4 h-4 mr-1" />
          新規作成
        </button>
      </div>

      {/* 新規ジャンル作成モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新しいジャンルを作成"
        size="sm"
      >
        <div className="space-y-4">
          {/* ジャンル名 */}
          <Input
            label="ジャンル名"
            placeholder="例: 仕事, 勉強, 趣味"
            value={newGenreName}
            onChange={(e) => setNewGenreName(e.target.value)}
            required
          />

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カラー
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-10 h-10 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? color : '#E5E7EB',
                    transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                  aria-label={`カラー ${color}`}
                >
                  {selectedColor === color && (
                    <Check className="w-5 h-5 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 作成ボタン */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleCreateGenre}
            isLoading={isCreating}
            disabled={!newGenreName.trim()}
          >
            作成
          </Button>
        </div>
      </Modal>
    </div>
  );
};
