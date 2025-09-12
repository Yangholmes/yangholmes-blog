/**
 * @file transformHead 钩子
 * @author Yangholmes 2025-09-12
 */

import { HeadConfig } from 'vitepress';
import { TransformContext } from 'vitepress';

export default function transformHead(ctx: TransformContext) {
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
}
