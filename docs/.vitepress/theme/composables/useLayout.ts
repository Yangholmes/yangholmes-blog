/**
 * @file
 * @author Yangholmes 2025-08-05
 */

import { useData } from 'vitepress';
import { shallowRef, watch } from 'vue';
import Page from '../Page.vue';

export default function useLayout() {
  const { frontmatter } = useData();

  // 动态加载的布局组件
  const activeLayout = shallowRef();
  const layoutCache = shallowRef({});

  function loadLayout() {
    // 根据页面的 frontmatter 中的 layout 字段动态加载组件
    const layoutName = frontmatter.value.layout || 'Page';
    import(`../${layoutName}.vue`)
      .then((module) => {
        activeLayout.value = module.default;
        // 缓存已加载的布局组件
        layoutCache.value[layoutName] = module.default;
      })
      .catch((error) => {
        console.warn(`Failed to load layout component: ${error}`);
        activeLayout.value = Page;
      });
  }

  watch(() => frontmatter.value.layout, (layoutName) => {
    if (layoutCache.value[layoutName]) {
      activeLayout.value = layoutCache.value[layoutName];
      return;
    }
    loadLayout();
  }, { immediate: true });

  return activeLayout;
}