<script lang="ts" setup>
import {useTemplateRef, onMounted, nextTick, ref, onUnmounted} from 'vue';
import {useComment} from './composables/useComment';

  const pageRef = useTemplateRef('page-ref');
  const commentRef = useTemplateRef('comment-ref');

  useComment(commentRef);

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

</script>

<template>
  <div class="page" ref="page-ref">
    <div class="vp-doc">
      <Content />
    </div>
    <div ref="comment-ref" />
    <Footer />
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  padding: 3rem;

  overflow: auto;

  .vp-doc {
    width: 100%;
    /* margin-top: 3rem; */
    /* height: 100%; */

    :deep(.table-of-contents) {
      width: auto;
      padding: 1.25rem 1.25rem 1.25rem 0;

      display: inline-block;

      border: 2px solid var(--color--level-3);
      border-radius: 20px;

      ul {
        margin: 0;
        list-style: none;
      }

      a {
        text-decoration: none;
      }
    }
  }
}
</style>
