<script lang="ts" setup>
import {ref, shallowRef, useTemplateRef} from 'vue';
import {useComment} from './composables/useComment';

  const commentRef = useTemplateRef('comment-ref');

  useComment(commentRef)
</script>

<template>
  <div class="page">
    <div class="vp-doc">
      <Content />
      <div ref="comment-ref" />
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  padding: 0 3em;

  overflow: auto;

  .vp-doc {
    width: 100%;
    margin: 3em 0;
    /* height: 100%; */
  }
}
</style>
