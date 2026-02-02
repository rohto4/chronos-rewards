/**
 * CrystalDisplayコンポーネント
 * 
 * クリスタル残高表示
 * - キラキラエフェクト
 * - アニメーション対応
 * - 増減表示
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Diamond } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CrystalDisplayコンポーネントのプロパティ型
 */
export interface CrystalDisplayProps {
  amount: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

/**
 * CrystalDisplayコンポーネント
 */
export const CrystalDisplay = ({
  amount,
  showLabel = false,
  size = 'md',
  animated = true,
}: CrystalDisplayProps) => {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [delta, setDelta] = useState<number | null>(null);
  const [sparkle, setSparkle] = useState(false);
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
      
      // キラキラエフェクト
      if (difference > 0) {
        setSparkle(true);
        setTimeout(() => setSparkle(false), 1000);
      }
      
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
        className={`flex items-center ${styles.container} bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 rounded-full relative overflow-hidden`}
      >
        {/* キラキラエフェクト */}
        {sparkle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
            style={{ transform: 'skewX(-20deg)' }}
          />
        )}

        <Diamond className={`${styles.icon} text-purple-600`} />
        <span className={`${styles.text} font-bold text-purple-900`}>
          {displayAmount.toLocaleString()}
        </span>
        {showLabel && (
          <span className={`${styles.text} text-purple-700`}>クリスタル</span>
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
