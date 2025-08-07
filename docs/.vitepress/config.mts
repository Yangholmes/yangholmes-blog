import { defineConfigWithTheme } from 'vitepress'
import { SearchPlugin } from "vitepress-plugin-search";
import flexSearchIndexOptions from "flexsearch";
import autoprefixer from 'autoprefixer';
import MsClarity from "vite-plugin-ms-clarity";

import { getAllCategories, getAllPosts } from './utils';

const MS_CLARITY_ID = process.env.MS_CLARITY_ID || '';

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
      }),
      MsClarity({
        id: MS_CLARITY_ID,
        enableInDevMode: false,
        injectTo: 'body'
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
      },
      {
        icon: 'instagram',
        link: 'https://www.instagram.com/yangholmes/'
      },
      {
        icon: 'wechat',
        link: '/wechat-qrcode.png'
      }
    ]
  }
})
