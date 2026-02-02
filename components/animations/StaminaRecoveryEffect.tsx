/**
 * StaminaRecoveryEffectコンポーネント
 * 
 * スタミナ回復時のエフェクト
 * - 回復通知
 * - パルスエフェクト
 * - 回復量表示
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

/**
 * StaminaRecoveryEffectコンポーネントのプロパティ型
 */
export interface StaminaRecoveryEffectProps {
  recoveredAmount: number;
  currentStamina: number;
  maxStamina: number;
  onComplete: () => void;
  position?: 'top' | 'center' | 'bottom';
}

/**
 * StaminaRecoveryEffectコンポーネント
 */
export const StaminaRecoveryEffect = ({
  recoveredAmount,
  currentStamina,
  maxStamina,
  onComplete,
  position = 'top',
}: StaminaRecoveryEffectProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  /**
   * 位置スタイル
   */
  const positionStyles = {
    top: 'top-20',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-20',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed left-1/2 -translate-x-1/2 ${positionStyles[position]} z-40 pointer-events-none`}
    >
      {/* パルスエフェクト */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 3], opacity: [0, 0.5, 0] }}
        transition={{
          duration: 1.5,
          ease: 'easeOut',
        }}
        className="absolute inset-0 bg-green-400 rounded-full blur-xl"
      />

      {/* メインカード */}
      <motion.div
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 20 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        className="relative"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-2xl p-4 min-w-[200px]">
          {/* アイコンとテキスト */}
          <div className="flex items-center gap-3">
            {/* アニメーションアイコン */}
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
              }}
            >
              <Zap className="w-8 h-8 text-white fill-white" />
            </motion.div>

            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                スタミナ回復
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  +{recoveredAmount}
                </span>
                <span className="text-xs text-green-100">
                  ({currentStamina}/{maxStamina})
                </span>
              </div>
            </div>
          </div>

          {/* パーティクル */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos(angle) * 50,
                  y: Math.sin(angle) * 50,
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full"
              />
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * スタミナ全回復エフェクト
 */
export const StaminaFullRecoveryEffect = ({
  onComplete,
}: {
  onComplete: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* 背景の光 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2, opacity: [0, 0.5, 0] }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-gradient-radial from-green-400/30 via-transparent to-transparent"
      />

      {/* メインテキスト */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Zap className="w-20 h-20 text-green-500 fill-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            スタミナ全回復！
          </h2>
          <p className="text-gray-600">新しいタスクに挑戦しよう</p>
        </div>
      </motion.div>

      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
    </motion.div>
  );
};
