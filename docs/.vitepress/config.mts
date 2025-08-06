import { defineConfigWithTheme } from 'vitepress'
import { SearchPlugin } from "vitepress-plugin-search";
import flexSearchIndexOptions from "flexsearch";
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
      SearchPlugin({
        ...flexSearchIndexOptions,
        previewLength: 100, //搜索结果预览长度
        buttonLabel: "搜索",
        placeholder: "情输入关键词",
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

    search: {
      provider: 'local',
    },

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
