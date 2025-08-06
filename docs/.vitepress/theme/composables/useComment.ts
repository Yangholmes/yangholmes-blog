import { onUnmounted, shallowRef, ShallowRef, watchEffect } from 'vue';

export function useComment(el: ShallowRef<HTMLDivElement | null>) {

  const scriptRef = shallowRef<HTMLScriptElement | null>(null);

  watchEffect(() => {
    if (!el.value) return;

    let script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'Yangholmes/requirejs-vue');
    script.setAttribute('issue-term', 'pathname');
    // script.setAttribute('theme', 'github-light');
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