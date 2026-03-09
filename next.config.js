const withPWA = require('next-pwa');

/** @type {import('next').NextConfig} */
/**
 * Next.js設定ファイル
 * 画像最適化、環境変数定義、開発時にはPWA処理を無効化する
 */
const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  // React Strict Modeを有効化（開発時の潜在的な問題を検出）
  reactStrictMode: true,

  // 画像最適化設定
  images: {
    // 外部画像ドメインの許可（アバター画像など）
    domains: ['lh3.googleusercontent.com'],
    // 画像フォーマット優先順位
    formats: ['image/avif', 'image/webp'],
  },

  // 環境変数の公開設定
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // TypeScriptエラーを無視しない（ビルド時に型エラーがあれば失敗させる）
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLintエラーを無視しない
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 実験的機能
  experimental: {
    // Server Actionsを有効化（将来的な機能拡張用）
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

const nextPWAConfig = {
  dest: 'public',
  disable: !isProduction,
  register: true,
  skipWaiting: true,
};

module.exports = withPWA(nextPWAConfig)(baseConfig);
