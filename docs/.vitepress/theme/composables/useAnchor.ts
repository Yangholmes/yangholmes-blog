import { ref, nextTick, ShallowRef, onMounted, onUnmounted } from 'vue';

export function useAnchor(pageRef: ShallowRef<HTMLDivElement | null>) {

  // function goHash() {
  //   const { hash } = location;
  //   const target = document.getElementById(decodeURIComponent(hash).slice(1));
  //   target ? target.scrollIntoView({
  //     block: 'start',
  //     behavior: 'smooth'
  //   }): pageRef.value?.scrollTo(0, 0);
  // }

  const controller = ref<AbortController>();
  onMounted(() => {
    nextTick(() => {
      controller.value = new AbortController();
      pageRef.value?.addEventListener('click', (evt) => {
        const link = (evt.target as (HTMLElement | null))?.closest?.('a');
        if (!link) {
          return;
        }
        const linkHref = link.getAttribute('href') || '';
        const { origin, hash } = new URL(linkHref, link.baseURI);
        if (origin === location.origin && hash) {
          const target = link.classList.contains('header-anchor')
            ? link
            : document.getElementById(decodeURIComponent(hash).slice(1));
          target?.scrollIntoView({
            block: 'start',
            behavior: 'smooth'
          });
        }
      }, {
        signal: controller.value.signal
      });
    });
  });

  onUnmounted(() => {
    controller.value?.abort();
  });
}