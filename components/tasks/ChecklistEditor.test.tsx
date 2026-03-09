import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChecklistEditor } from './ChecklistEditor';

describe('ChecklistEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provided items with delete controls', () => {
    const onChange = vi.fn();
    const items = ['アイテム1', 'アイテム2'];

    render(<ChecklistEditor items={items} onChange={onChange} />);

    expect(screen.getByText('アイテム1')).toBeInTheDocument();
    expect(screen.getByText('アイテム2')).toBeInTheDocument();
    expect(screen.getAllByLabelText('削除')).toHaveLength(2);
  });

  it('adds a trimmed item when the add button is clicked', () => {
    const onChange = vi.fn();
    render(<ChecklistEditor items={['既存タスク']} onChange={onChange} />);

    const input = screen.getByPlaceholderText('チェックリスト項目を入力') as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: '追加' });

    fireEvent.change(input, { target: { value: '  新しい項目  ' } });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    expect(onChange).toHaveBeenCalledWith(['既存タスク', '新しい項目']);
    expect(input.value).toBe('');
  });

  it('ignores whitespace-only input when adding', () => {
    const onChange = vi.fn();
    render(<ChecklistEditor items={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText('チェックリスト項目を入力') as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: '追加' });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(addButton).toBeDisabled();
  });

  it('adds a new item when Enter is pressed', () => {
    const onChange = vi.fn();
    render(<ChecklistEditor items={['既存']} onChange={onChange} />);

    const input = screen.getByPlaceholderText('チェックリスト項目を入力') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'キー入力追加' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['既存', 'キー入力追加']);
  });

  it('ignores key presses that are not Enter', () => {
    const onChange = vi.fn();
    render(<ChecklistEditor items={['既存']} onChange={onChange} />);

    const input = screen.getByPlaceholderText('チェックリスト項目を入力') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '無視するキー' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('無視するキー');
  });

  it('calls onChange with filtered items when a delete control is clicked', () => {
    const onChange = vi.fn();
    const items = ['一つ目', '二つ目'];

    render(<ChecklistEditor items={items} onChange={onChange} />);

    const deleteButtons = screen.getAllByLabelText('削除');
    fireEvent.click(deleteButtons[0]);

    expect(onChange).toHaveBeenCalledWith(['二つ目']);
  });
});
