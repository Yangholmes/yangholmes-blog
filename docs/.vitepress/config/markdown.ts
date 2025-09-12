/**
 * @file markdown 配置
 * @author Yangholmes 2025-09-12
 */

import MarkdownIt from 'markdown-it';
import { createDatePlugin } from './markdown-it-plugins/createDate-plugin';

export default {
  lineNumbers: true,
  image: {
    lazyLoading: true
  },
  config(md: MarkdownIt) {
    md.use(createDatePlugin);
  }
};
