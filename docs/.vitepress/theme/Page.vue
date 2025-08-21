<script lang="ts" setup>
  import {useTemplateRef} from 'vue';
  import {useComment} from './composables/useComment';
  import {useAnchor} from './composables/useAnchor';

  const pageRef = useTemplateRef('page-ref');
  const commentRef = useTemplateRef('comment-ref');

  useComment(commentRef);
  useAnchor(pageRef);

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
