/**
 * Cardコンポーネント
 * 
 * コンテンツをグループ化するカードUI
 * - ヘッダー（タイトル・説明）
 * - ボディ（メインコンテンツ）
 * - フッター（アクション）
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card - ルートコンポーネント
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-gray-200 shadow-sm',
      outline: 'border-2 border-gray-300',
      ghost: 'bg-transparent',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl overflow-hidden',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

/**
 * CardHeader - カードヘッダー
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-100', className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - カードタイトル
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-gray-900', className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - カード説明文
 */
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('mt-1 text-sm text-gray-600', className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

/**
 * CardBody - カードボディ
 */
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      />
    );
  }
);
CardBody.displayName = 'CardBody';

/**
 * CardFooter - カードフッター
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-t border-gray-100 flex items-center gap-2', className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';
