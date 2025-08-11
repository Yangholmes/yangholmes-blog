import { useData } from 'vitepress';
import { onUnmounted, shallowRef, ShallowRef, watch } from 'vue';

export function useComment(el: ShallowRef<HTMLDivElement | null>) {
  const { isDark } = useData()

  const scriptRef = shallowRef<HTMLScriptElement | null>(null);

  watch(() => el.value, () => {
    if (!el.value) return;

    // let script = document.createElement('script');
    // script.src = 'https://utteranc.es/client.js';
    // script.setAttribute('repo', 'Yangholmes/yangholmes-blog');
    // script.setAttribute('issue-term', 'pathname');
    // script.setAttribute('theme', isDark.value ? 'github-dark' : 'github-light');
    // script.setAttribute('crossorigin', 'anonymous');
    // el.value.appendChild(script);
    // scriptRef.value = script

    let script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Yangholmes/yangholmes-blog'); // 仓库
    script.setAttribute('data-repo-id', 'R_kgDOPZRnnA'); // 仓库 id
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', 'DIC_kwDOPZRnnM4CuBm9'); // 分类 id
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', '1');
    el.value.appendChild(script);
    scriptRef.value = script
  })

  onUnmounted(() => {
    if (scriptRef.value) {
      el.value?.removeChild(scriptRef.value);
      scriptRef.value?.remove();
    }
  })

}