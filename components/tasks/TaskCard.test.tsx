import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskCard } from './TaskCard';
import type { TaskWithGenre } from '@/types/database';

let swipeLeftHandler: (() => void) | null = null;

vi.mock('framer-motion', () => {
  const MotionDiv = ({ children, ...props }: Record<string, unknown>) => {
    const {
      initial,
      animate,
      exit,
      transition,
      layout,
      whileHover,
      whileTap,
      ...domProps
    } = props;
    return <div {...domProps}>{children as ReactNode}</div>;
  };

  return {
    motion: { div: MotionDiv },
  };
});

vi.mock('react-swipeable', () => ({
  useSwipeable: (config: { onSwipedLeft?: () => void }) => {
    swipeLeftHandler = config.onSwipedLeft ?? null;
    return {};
  },
}));

const createTask = (override: Partial<TaskWithGenre> = {}): TaskWithGenre => ({
  id: 'task-1',
  user_id: 'user-1',
  parent_task_id: null,
  title: 'テストタスク',
  description: '説明',
  genre_id: 'genre-1',
  deadline: '2026-02-24T00:00:00.000Z',
  estimated_hours: 2,
  benefits: null,
  is_completed: false,
  completed_at: null,
  completion_progress: 0,
  detail_level: 3,
  has_prerequisites: false,
  has_benefits: false,
  created_at: '2026-02-23T00:00:00.000Z',
  updated_at: '2026-02-23T00:00:00.000Z',
  deleted_at: null,
  genre: {
    id: 'genre-1',
    user_id: 'user-1',
    name: '仕事',
    color: '#3B82F6',
    usage_count: 1,
    created_at: '2026-02-23T00:00:00.000Z',
    updated_at: '2026-02-23T00:00:00.000Z',
  },
  checklist: [],
  ...override,
});

describe('TaskCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-23T00:00:00.000Z'));
    swipeLeftHandler = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows overdue/today/remaining/completed statuses', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(
      <TaskCard task={createTask({ deadline: '2026-02-22T00:00:00.000Z' })} onComplete={onComplete} onDelete={onDelete} />
    );
    expect(screen.getByText('期限切れ')).toBeInTheDocument();

    rerender(<TaskCard task={createTask({ deadline: new Date().toISOString() })} onComplete={onComplete} onDelete={onDelete} />);
    expect(screen.getByText('今日まで')).toBeInTheDocument();

    rerender(<TaskCard task={createTask({ deadline: '2026-02-26T00:00:00.000Z' })} onComplete={onComplete} onDelete={onDelete} />);
    expect(screen.getByText('残り3日')).toBeInTheDocument();

    rerender(<TaskCard task={createTask({ deadline: '2026-03-02T00:00:00.000Z' })} onComplete={onComplete} onDelete={onDelete} />);
    expect(screen.getByText('残り7日')).toBeInTheDocument();

    rerender(<TaskCard task={createTask({ deadline: '2026-03-05T00:00:00.000Z' })} onComplete={onComplete} onDelete={onDelete} />);
    expect(screen.getByText('残り10日')).toBeInTheDocument();

    rerender(
      <TaskCard
        task={createTask({ is_completed: true, completed_at: '2026-02-23T12:00:00.000Z' })}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  it('renders checklist progress when checklist exists', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();
    const task = createTask({
      checklist: [
        { id: 'c1', task_id: 'task-1', item_text: 'a', is_checked: true, display_order: 0, created_at: '', updated_at: '' },
        { id: 'c2', task_id: 'task-1', item_text: 'b', is_checked: false, display_order: 1, created_at: '', updated_at: '' },
      ],
    });

    render(<TaskCard task={task} onComplete={onComplete} onDelete={onDelete} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('calls callbacks from complete/delete buttons', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(<TaskCard task={createTask()} onComplete={onComplete} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('完了'));
    fireEvent.click(screen.getByLabelText('削除'));

    expect(onComplete).toHaveBeenCalledWith('task-1');
    expect(onDelete).toHaveBeenCalledWith('task-1');
  });

  it('supports keyboard activation for onClick', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();
    const onClick = vi.fn();

    render(<TaskCard task={createTask()} onComplete={onComplete} onDelete={onDelete} onClick={onClick} />);
    const card = screen.getByRole('button', { name: /タスク: テストタスク/ });

    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('ignores keyboard activation when onClick is not provided', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(<TaskCard task={createTask()} onComplete={onComplete} onDelete={onDelete} />);
    const card = screen.getByRole('button', { name: /タスク: テストタスク/ });

    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onComplete).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('swipe left deletes only incomplete tasks', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(<TaskCard task={createTask()} onComplete={onComplete} onDelete={onDelete} />);
    swipeLeftHandler?.();
    expect(onDelete).toHaveBeenCalledWith('task-1');

    onDelete.mockClear();
    render(
      <TaskCard
        task={createTask({ is_completed: true, completed_at: '2026-02-23T12:00:00.000Z' })}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    );
    swipeLeftHandler?.();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('hides genre badge and description when data is missing', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskCard
        task={createTask({ genre: null, description: '' })}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText('仕事')).not.toBeInTheDocument();
    expect(screen.queryByText('説明')).not.toBeInTheDocument();
  });

  it('removes action buttons once the task is completed', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskCard
        task={createTask({ is_completed: true, completed_at: '2026-02-23T12:00:00.000Z' })}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByRole('button', { name: '完了' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('削除')).not.toBeInTheDocument();
  });

  it('does not render checklist progress when no checklist exists', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(<TaskCard task={createTask({ checklist: [] })} onComplete={onComplete} onDelete={onDelete} />);

    expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
