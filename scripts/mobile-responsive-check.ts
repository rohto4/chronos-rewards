/**
 * モバイルレスポンシブ検証スクリプト
 * 
 * 375px, 390px, 414px の幅で各ページをスクリーンショットして問題を検出
 */

import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const WIDTHS = [375, 390, 414];
const PAGES = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/calendar', name: 'calendar' },
  { path: '/statistics', name: 'statistics' },
];

async function checkMobileResponsive() {
  console.log('🚀 モバイルレスポンシブ検証開始\n');

  // スクリーンショット保存ディレクトリ作成
  const screenshotDir = join(process.cwd(), 'tmp', 'mobile-screenshots');
  await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const width of WIDTHS) {
    console.log(`\n📱 幅: ${width}px で検証中...`);
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const pageInfo of PAGES) {
      try {
        console.log(`  ✓ ${pageInfo.name} ページを確認中...`);
        
        // ページにアクセス
        await page.goto(`http://localhost:3000${pageInfo.path}`, {
          waitUntil: 'networkidle',
          timeout: 10000,
        });

        // スクリーンショット撮影
        const screenshotPath = join(
          screenshotDir,
          `${pageInfo.name}-${width}px.png`
        );
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        console.log(`    → ${screenshotPath}`);

        // タッチターゲットのサイズチェック（ボタン要素）
        const buttons = await page.$$('button');
        let smallButtonCount = 0;

        for (const button of buttons) {
          const box = await button.boundingBox();
          if (box && (box.width < 48 || box.height < 48)) {
            smallButtonCount++;
          }
        }

        if (smallButtonCount > 0) {
          console.log(`    ⚠️ 48px 未満のボタンが ${smallButtonCount} 個検出されました`);
        }

        // 横スクロールの検出
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (hasHorizontalScroll) {
          console.log(`    ⚠️ 横スクロールが発生しています`);
        }

      } catch (error) {
        console.error(`    ✗ エラー: ${error}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ モバイルレスポンシブ検証完了');
  console.log(`📸 スクリーンショット: ${screenshotDir}`);
}

checkMobileResponsive().catch(console.error);
