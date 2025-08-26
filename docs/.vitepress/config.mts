import { defineConfigWithTheme, HeadConfig } from 'vitepress';
import { SearchPlugin } from 'vitepress-plugin-search';
import { withMermaid } from 'vitepress-plugin-mermaid';
import flexSearchIndexOptions from 'flexsearch';
import autoprefixer from 'autoprefixer';

import { getAllCategories, getAllPosts } from './utils';

const MS_CLARITY_ID = process.env.MS_CLARITY_ID || '';

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfigWithTheme({
  lang: 'zh-cn',
  title: 'Yangholmes\' blog',
  description: 'Yangholmes\' blog',
  lastUpdated: true,

  vite: {
    plugins: [
      SearchPlugin({
        ...flexSearchIndexOptions,
        previewLength: 50, //搜索结果预览长度
        buttonLabel: '搜索',
        placeholder: '输入关键词',
        encode: false,
        tokenize: 'full'
      })
    ],
    css: {
      postcss: {
        plugins:[
          autoprefixer(),
        ]
      }
    },
    optimizeDeps: {
      include: ['mermaid']
    }
  },

  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/icon.png' }]
  ],

  markdown: {
    lineNumbers: true,
  },


  transformHead(ctx) {
    const { pageData } = ctx;
    const head: HeadConfig[] = [];

    head.push(
      ['meta', {
        property: 'og:title',
        content: pageData.title
      }],
      ['meta', {
        property: 'og:description',
        content: pageData.description || pageData.title
      }],
      ['meta', {
        property: 'og:type',
        content: 'website'
      }],
      ['meta', {
        property: 'og:image',
        content: ''
      }],
      // ['meta', {
      //   property: 'og:url',
      //   content: SITE_URL
      // }],
    );

    return head;
  },

  transformHtml(code) {
    if (MS_CLARITY_ID) {
      return code.replace(
        '</body>',
        `<script type="text/javascript">
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${MS_CLARITY_ID}");
        </script></body>`
      );
    }
    return code;
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
}));
