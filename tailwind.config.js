/** @type {import('tailwindcss').Config} */

/**
 * Tailwind CSS設定ファイル
 * ダークモードオンリーのカラーテーマを定義
 */
module.exports = {
  // ダークモードをクラスベースで制御（classが指定されている時のみダークモード）
  darkMode: ['class'],
  
  // スキャン対象ファイル
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // カスタムカラーパレット（ダークモード用）
      colors: {
        // ベース背景色
        background: 'hsl(222.2 84% 4.9%)', // 深い青黒
        foreground: 'hsl(210 40% 98%)', // ほぼ白
        
        // カード・パネル
        card: 'hsl(222.2 84% 10%)', // 背景より少し明るい
        'card-foreground': 'hsl(210 40% 98%)',
        
        // ポップオーバー
        popover: 'hsl(222.2 84% 10%)',
        'popover-foreground': 'hsl(210 40% 98%)',
        
        // プライマリーカラー（アクセント）
        primary: {
          DEFAULT: 'hsl(217.2 91.2% 59.8%)', // 青
          foreground: 'hsl(222.2 47.4% 11.2%)',
        },
        
        // セカンダリーカラー
        secondary: {
          DEFAULT: 'hsl(217.2 32.6% 17.5%)', // 暗い青
          foreground: 'hsl(210 40% 98%)',
        },
        
        // ミュートカラー（控えめな要素用）
        muted: {
          DEFAULT: 'hsl(217.2 32.6% 17.5%)',
          foreground: 'hsl(215 20.2% 65.1%)',
        },
        
        // アクセントカラー（ホバー時など）
        accent: {
          DEFAULT: 'hsl(217.2 32.6% 17.5%)',
          foreground: 'hsl(210 40% 98%)',
        },
        
        // 破壊的アクション（削除など）
        destructive: {
          DEFAULT: 'hsl(0 62.8% 30.6%)', // 赤
          foreground: 'hsl(210 40% 98%)',
        },
        
        // ボーダー
        border: 'hsl(217.2 32.6% 17.5%)',
        input: 'hsl(217.2 32.6% 17.5%)',
        ring: 'hsl(224.3 76.3% 48%)', // フォーカス時のリング
        
        // 報酬カラー（ゲーム要素）
        coin: {
          DEFAULT: 'hsl(45 93% 47%)', // ゴールド
          glow: 'hsl(45 100% 60%)',
        },
        crystal: {
          DEFAULT: 'hsl(280 100% 70%)', // 紫クリスタル
          glow: 'hsl(280 100% 80%)',
        },
        stamina: {
          DEFAULT: 'hsl(120 60% 50%)', // グリーン
          low: 'hsl(0 80% 60%)', // 赤（低スタミナ警告）
        },
      },
      
      // ボーダーRadius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      
      // アニメーションキーフレーム
      keyframes: {
        // コイン獲得アニメーション
        'coin-float': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-20px) scale(1.2)', opacity: '0.8' },
          '100%': { transform: 'translateY(-40px) scale(0.5)', opacity: '0' },
        },
        // クリスタル獲得アニメーション
        'crystal-float': {
          '0%': { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-30px) rotate(180deg) scale(1.3)', opacity: '0.9' },
          '100%': { transform: 'translateY(-60px) rotate(360deg) scale(0.3)', opacity: '0' },
        },
        // スワイプヒントアニメーション
        'swipe-hint': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        // フェードイン
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // スライドアップ
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      // アニメーション設定
      animation: {
        'coin-float': 'coin-float 1s ease-out forwards',
        'crystal-float': 'crystal-float 1.5s ease-out forwards',
        'swipe-hint': 'swipe-hint 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  
  // Tailwind CSSプラグイン
  plugins: [
    require('tailwindcss-animate'),
  ],
};
