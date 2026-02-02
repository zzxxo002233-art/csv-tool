import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 本地开发 base 为 /，部署到 GitHub Pages 时由 CI 设置 BASE_PATH（如 /repo-name/）
const base = process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/Short-materials-gacha/' : '/');

export default defineConfig({
  plugins: [
    react(),
    // 生成 404.html 供 GitHub Pages SPA 刷新使用
    {
      name: 'copy-404',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist');
        const indexPath = path.join(outDir, 'index.html');
        const notFoundPath = path.join(outDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
        }
      },
    },
  ],
  base,
  build: {
    outDir: 'dist',
  },
});
