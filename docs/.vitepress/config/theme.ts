/**
 * @file 主题配置
 * @author Yangholmes 2025-09-12
 */

import { LocaleSpecificConfig } from 'vitepress';
import { getAllCategories, getAllPostsByCat } from '../utils';

const themeConfig: LocaleSpecificConfig['themeConfig'] = {
  // categories: getAllCategories(),
  // posts: await getAllPostsByCat(),
  lastUpdated: true,

  whoami: {
    avatar: '/cats.png',
    name: 'Yangholmes',
    description: '邋遢和小松的铲屎官'
  },

  // 私有配置项
  page: {
    backToTop: true,
    comment: true,
    relatedTags: true
  },

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
};

export default themeConfig;
