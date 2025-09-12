import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import 'vitepress/dist/client/theme-default/styles/components/vp-doc.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-code.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css';
import 'vitepress/dist/client/theme-default/styles/components/custom-block.css';
import 'vitepress/dist/client/theme-default/styles/base.css';
import 'vitepress/dist/client/theme-default/styles/utils.css';
import 'vitepress/dist/client/theme-default/styles/vars.css';
import 'vitepress/dist/client/theme-default/styles/icons.css';
import './global.less';

import Layout from './Layout.vue';
import Footer from './Footer.vue';

export default {
  extends: DefaultTheme,
  Layout,

  enhanceApp({ app, router, siteData }) {
    // 注册全局组件或插件
    app.component('Footer', Footer);
  }
} satisfies Theme;
