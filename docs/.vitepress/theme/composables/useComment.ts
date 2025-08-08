import { useData } from 'vitepress';
import { onUnmounted, shallowRef, ShallowRef, watch } from 'vue';

export function useComment(el: ShallowRef<HTMLDivElement | null>) {
  const { isDark } = useData()

  const scriptRef = shallowRef<HTMLScriptElement | null>(null);

  watch(() => el.value, () => {
    if (!el.value) return;

    let script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'Yangholmes/yangholmes-blog');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', isDark.value ? 'github-dark' : 'github-light');
    script.setAttribute('crossorigin', 'anonymous');
    el.value.appendChild(script);
    scriptRef.value = script;
  })

  onUnmounted(() => {
    if (scriptRef.value) {
      el.value?.removeChild(scriptRef.value);
      scriptRef.value?.remove();
    }
  })

}