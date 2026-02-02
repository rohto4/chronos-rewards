/**
 * RewardAnimationコンポーネント
 * 
 * 報酬獲得時のアニメーション表示
 * - コイン獲得
 * - クリスタル獲得
 * - レベルアップ
 * - 親タスク完了
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Diamond, Trophy, CheckCircle } from 'lucide-react';

/**
 * RewardAnimationコンポーネントのプロパティ型
 */
export interface RewardAnimationProps {
  type: 'coin' | 'crystal' | 'levelup' | 'parent-complete';
  amount?: number;
  level?: number;
  onComplete: () => void;
}

/**
 * RewardAnimationコンポーネント
 */
export const RewardAnimation = ({
  type,
  amount = 0,
  level,
  onComplete,
}: RewardAnimationProps) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    // パーティクル生成
    const particleCount = type === 'levelup' ? 30 : 15;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    }));
    setParticles(newParticles);

    // アニメーション終了後にコールバック
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  /**
   * アニメーション設定
   */
  const config = {
    coin: {
      icon: Coins,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      title: 'コイン獲得！',
      subtitle: `+${amount.toLocaleString()}`,
    },
    crystal: {
      icon: Diamond,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
      title: 'クリスタル獲得！',
      subtitle: `+${amount.toLocaleString()}`,
    },
    levelup: {
      icon: Trophy,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
      title: 'レベルアップ！',
      subtitle: level ? `Lv.${level}` : '',
    },
    'parent-complete': {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      title: '親タスク完了！',
      subtitle: 'おめでとうございます',
    },
  };

  const { icon: Icon, color, bgColor, title, subtitle } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* パーティクル */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1, 0.5],
            x: particle.x * 3,
            y: particle.y * 3,
          }}
          transition={{
            duration: 2,
            ease: 'easeOut',
          }}
          className={`absolute w-3 h-3 rounded-full ${bgColor}`}
        />
      ))}

      {/* メインアニメーション */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0, rotate: 180 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        className="relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* アイコン */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: 2,
              ease: 'easeInOut',
            }}
            className="flex justify-center mb-4"
          >
            <div className={`p-4 rounded-full bg-gradient-to-br from-white to-gray-100`}>
              <Icon className={`w-16 h-16 ${color}`} />
            </div>
          </motion.div>

          {/* タイトル */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            {title}
          </motion.h2>

          {/* サブタイトル */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-bold ${color}`}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    </motion.div>
  );
};
