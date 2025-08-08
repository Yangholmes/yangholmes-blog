<script lang="ts" setup>
import {useTemplateRef} from 'vue';
import {useComment} from './composables/useComment';

  const commentRef = useTemplateRef('comment-ref');

  useComment(commentRef)

</script>

<template>
  <div class="page">
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
  }
}
</style>
