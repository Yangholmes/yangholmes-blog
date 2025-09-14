/**
 * @file transformHead 钩子
 * @author Yangholmes 2025-09-12
 */

import { HeadConfig } from 'vitepress';
import { TransformContext } from 'vitepress';

export default function transformHead(ctx: TransformContext) {
  const { pageData } = ctx;
  const head: HeadConfig[] = [];

  let tags = [];
  if (Array.isArray(pageData.frontmatter.tags)) {
    tags = pageData.frontmatter.tags.map(tag => tag.trim());
  } else if (typeof pageData.frontmatter.tags === 'string') {
    tags = pageData.frontmatter.tags.split(',').map(tag => tag.trim());
  }
  const tagsStr = tags.length ? `${tags.join(', ')}` : '';
  const description = pageData.description || `${[pageData.title, tagsStr].join(', ')}`;

  head.push(
    ['meta', {
      property: 'og:title',
      content: pageData.title
    }],
    ['meta', {
      property: 'og:description',
      content: description
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
