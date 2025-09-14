/**
 * @file createDate 插件
 * @author Yangholmes 2025-08-29
 */

import MarkdownIt, { PluginWithOptions, } from 'markdown-it';
import dayjs from 'dayjs';

type Tokens = Parameters<MarkdownIt['renderer']['renderToken']>[0];

export const createDatePlugin: PluginWithOptions<{
  dateFormate?: string;
}> = (md, options = {}) => {
  const { dateFormate } = options;
  // 存储 frontmatter 数据
  let createDate: string | number;

  // add toc syntax as a block rule
  md.block.ruler.before(
    'heading',
    'createDate',
    (state) => {
      if (state.env && state.env.frontmatter) {
        createDate = state.env.frontmatter.createDate;
      }
      return false;
    },
    {
      alt: ['paragraph', 'reference', 'blockquote'],
    },
  );

  // 替换逻辑
  const replaceDate = (tokens: Tokens, idx: number) => {
    const token = tokens[idx];
    if (token.type === 'text' && createDate) {
      // 跳过代码块、数学公式等特殊区域
      const parentToken = tokens[idx - 1];
      const isInSpecialBlock = parentToken && (
        parentToken.type === 'fence' ||
        parentToken.type === 'code_block' ||
        parentToken.type === 'math_block'
      );

      if (!isInSpecialBlock) {
        const date = dayjs(createDate).format(dateFormate || 'YYYY年MM月DD日');
        token.content = token.content.replace(/\[\[createDate\]\]/g, date);
      }
    }
  };

  // 在行内 token 渲染时处理
  const defaultRender = md.renderer.rules.text || (() => '');
  md.renderer.rules.text = (tokens, idx, options, env, self) => {
    replaceDate(tokens, idx);
    return defaultRender(tokens, idx, options, env, self);
  };
};
