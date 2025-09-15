/**
 * @file vite 配置
 * @author Yangholmes 2025-09-12
 */

import { resolve } from 'path';
import { UserConfig } from 'vitepress';

// @ts-ignore
import { SearchPlugin } from 'vitepress-plugin-search';
import flexSearchIndexOptions from 'flexsearch';
import autoprefixer from 'autoprefixer';

const viteConfig: UserConfig['vite'] = {
  publicDir: '../public',
  plugins: [
    SearchPlugin({
      ...flexSearchIndexOptions,
      previewLength: 50, //搜索结果预览长度
      buttonLabel: '搜索',
      placeholder: '输入关键词',
      encode: false,
      tokenize: 'full'
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "${resolve(__dirname, '../', 'theme/style/less-variables.less')}";`
      }
    },
    postcss: {
      plugins: [
        autoprefixer(),
      ]
    }
  },
  optimizeDeps: {
    include: ['mermaid']
  }
};

export default viteConfig;
