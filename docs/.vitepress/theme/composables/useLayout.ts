/**
 * @file
 * @author Yangholmes 2025-08-05
 */

import { useData } from 'vitepress';
import { computed, shallowRef, watch } from 'vue';
import Page from '../Page.vue';

export default function useLayout() {
  const { frontmatter } = useData();

  // 动态加载的布局组件
  const layoutName = computed(() => frontmatter.value.layout || 'Page');

  return layoutName;
}