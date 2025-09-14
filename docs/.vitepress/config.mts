import { defineConfigWithTheme } from 'vitepress';

// @ts-ignore
import { withMermaid } from 'vitepress-plugin-mermaid';

import viteConfig from './config/vite';
import transformHead from './config/transformHead';
import transformHtml from './config/transformHtml';
import markdown from './config/markdown';
import themeConfig from './config/theme';

const STIE_URL = process.env.STIE_URL || 'https://yangholmes.github.io';

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfigWithTheme({
  lang: 'zh-cn',
  title: 'Yangholmes\' blog',
  description: 'Yangholmes\' blog',
  lastUpdated: true,
  srcDir: 'posts',

  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/icon.png' }]
  ],

  sitemap: {
    hostname: STIE_URL
  },

  vite: viteConfig,

  markdown,

  transformHead,

  transformHtml,

  themeConfig,
}));
