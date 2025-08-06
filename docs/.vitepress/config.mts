import { defineConfigWithTheme } from 'vitepress'
import { pagefindPlugin, chineseSearchOptimize } from 'vitepress-plugin-pagefind';
import autoprefixer from 'autoprefixer';

import { getAllCategories, getAllPosts, importFile } from './utils'

// https://vitepress.dev/reference/site-config
export default defineConfigWithTheme({
  lang: 'zh-cn',
  title: 'Yangholmes\' blog',
  description: 'blog',
  lastUpdated: true,

  vite: {
    plugins: [
      pagefindPlugin({
        customSearchQuery: chineseSearchOptimize
      })
    ],
    css: {
      postcss: {
        plugins:[
          autoprefixer()
        ]
      }
    }
  },
  themeConfig: {
    categories: getAllCategories(),
    posts: await getAllPosts(),
    lastUpdated: true,

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Yangholmes'
      },
      {
        icon: 'dev',
        link: 'https://dev.to/yangholmes'
      }, {
        icon: 'wechat',
        link: '/wechat-qrcode.png'
      }
    ]
  }
})
