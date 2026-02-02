/**
 * LevelUpAnimationコンポーネント
 * 
 * レベルアップ時の派手な演出
 * - 光の演出
 * - レベル表示
 * - 報酬通知
 * - パーティクルエフェクト
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles } from 'lucide-react';

/**
 * LevelUpAnimationコンポーネントのプロパティ型
 */
export interface LevelUpAnimationProps {
  newLevel: number;
  rewards?: {
    coins?: number;
    crystals?: number;
    maxStamina?: number;
  };
  onComplete: () => void;
}

/**
 * LevelUpAnimationコンポーネント
 */
export const LevelUpAnimation = ({
  newLevel,
  rewards,
  onComplete,
}: LevelUpAnimationProps) => {
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    // 報酬表示タイミング
    const rewardTimer = setTimeout(() => {
      setShowRewards(true);
    }, 1500);

    // アニメーション終了
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(rewardTimer);
      clearTimeout(completeTimer);
    };
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
        animate={{ scale: 3, opacity: [0, 1, 0] }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-transparent to-transparent"
      />

      {/* 放射状の光線 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: [0, 1, 0] }}
          transition={{
            duration: 1.5,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
          className="absolute w-1 h-96 bg-gradient-to-t from-yellow-400 to-transparent"
          style={{
            transform: `rotate(${i * 30}deg)`,
            transformOrigin: 'center',
          }}
        />
      ))}

      {/* 回転する星 */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 200;
        return (
          <motion.div
            key={`star-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
            }}
            transition={{
              duration: 2,
              delay: i * 0.03,
              ease: 'easeOut',
            }}
            className="absolute"
          >
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </motion.div>
        );
      })}

      {/* メインコンテンツ */}
      <div className="relative z-10 text-center">
        {/* レベルアップテキスト */}
        <motion.div
          initial={{ opacity: 0, scale: 0, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent"
          >
            <h1 className="text-7xl font-black drop-shadow-2xl">
              LEVEL UP!
            </h1>
          </motion.div>

          {/* レベル表示 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-2xl">
              <Trophy className="w-10 h-10 text-amber-500" />
              <span className="text-5xl font-bold text-gray-900">
                Lv. {newLevel}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* 報酬表示 */}
        <AnimatePresence>
          {showRewards && rewards && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 bg-white rounded-xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  獲得報酬
                </h3>
              </div>
              <div className="space-y-2 text-left">
                {rewards.coins && (
                  <p className="text-gray-700">
                    💰 コイン <span className="font-bold text-yellow-600">+{rewards.coins}</span>
                  </p>
                )}
                {rewards.crystals && (
                  <p className="text-gray-700">
                    💎 クリスタル <span className="font-bold text-purple-600">+{rewards.crystals}</span>
                  </p>
                )}
                {rewards.maxStamina && (
                  <p className="text-gray-700">
                    ⚡ 最大スタミナ <span className="font-bold text-green-600">+{rewards.maxStamina}</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    </motion.div>
  );
};
