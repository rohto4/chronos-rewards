/**
 * CoinDisplayコンポーネント
 * 
 * コイン残高表示
 * - アニメーション対応
 * - 増減表示
 * - カウントアップエフェクト
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CoinDisplayコンポーネントのプロパティ型
 */
export interface CoinDisplayProps {
  amount: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

/**
 * CoinDisplayコンポーネント
 */
export const CoinDisplay = ({
  amount,
  showLabel = false,
  size = 'md',
  animated = true,
}: CoinDisplayProps) => {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [delta, setDelta] = useState<number | null>(null);
  const prevAmountRef = useRef(amount);

  // サイズスタイル
  const sizeStyles = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      container: 'gap-1 px-2 py-1',
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-base',
      container: 'gap-2 px-3 py-1.5',
    },
    lg: {
      icon: 'w-6 h-6',
      text: 'text-lg',
      container: 'gap-2 px-4 py-2',
    },
  };

  const styles = sizeStyles[size];

  /**
   * カウントアップアニメーション
   */
  useEffect(() => {
    if (!animated) {
      setDisplayAmount(amount);
      return;
    }

    const difference = amount - prevAmountRef.current;
    
    if (difference !== 0) {
      setDelta(difference);
      
      // デルタ表示を3秒後に消す
      const deltaTimer = setTimeout(() => {
        setDelta(null);
      }, 3000);

      // カウントアップアニメーション
      const duration = 500;
      const steps = 20;
      const stepValue = difference / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayAmount(prev => {
          const newValue = prevAmountRef.current + (stepValue * currentStep);
          if (currentStep >= steps) {
            clearInterval(interval);
            return amount;
          }
          return Math.round(newValue);
        });
      }, stepDuration);

      prevAmountRef.current = amount;

      return () => {
        clearTimeout(deltaTimer);
        clearInterval(interval);
      };
    }
  }, [amount, animated]);

  return (
    <div className="relative">
      <div
        className={`flex items-center ${styles.container} bg-yellow-50 border-2 border-yellow-400 rounded-full`}
      >
        <Coins className={`${styles.icon} text-yellow-600`} />
        <span className={`${styles.text} font-bold text-yellow-900`}>
          {displayAmount.toLocaleString()}
        </span>
        {showLabel && (
          <span className={`${styles.text} text-yellow-700`}>コイン</span>
        )}
      </div>

      {/* 増減表示 */}
      <AnimatePresence>
        {delta !== null && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 right-0 pointer-events-none"
          >
            <span
              className={`font-bold ${
                delta > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {delta > 0 ? '+' : ''}
              {delta.toLocaleString()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
