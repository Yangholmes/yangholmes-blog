<script lang="ts" setup>
  import {useData} from 'vitepress';
  import {useTemplateRef} from 'vue';
  import dayjs from 'dayjs';
  import {useComment} from './composables/useComment';
  import {useAnchor} from './composables/useAnchor';

  import BackToTop from './components/BackToTop.vue';
  import RelatedTags from './components/RelatedTags.vue';

  const { page, theme } = useData();

  const pageRef = useTemplateRef('page-ref');
  const commentRef = useTemplateRef('comment-ref');

  useComment(commentRef);
  useAnchor(pageRef);
</script>

<template>
  <div class="page" ref="page-ref">
    <div class="vp-doc">
      <Content />
      <div class="page-info">
        <p v-if="!!theme.lastUpdated">
          最后更新时间: {{ dayjs(page.lastUpdated).format('YYYY年MM月DD日') }}
        </p>
        <RelatedTags v-if="!!theme.page.relatedTags" />
      </div>
    </div>
    <div v-if="!!theme?.page?.comment" ref="comment-ref" />
    <BackToTop v-if="!!theme?.page?.backToTop" :container="pageRef" />
    <Footer />
  </div>
</template>

<style lang="less" scoped>
.page {
  width: 100%;
  height: 100%;
  padding: 3rem;

  overflow: auto;

  .vp-doc {

    // 目录宽度
    --toc-width: 13rem;

    @media (width <= @max-toc-width) {
      --toc-width: 0;
      :deep(.table-of-contents) {
        display: none;
      }
    }

    width: 100%;

    // 用于放置目录
    padding-right: var(--toc-width);

    transition: padding .3s;

    // 目录
    :deep(.table-of-contents) {
      width: var(--toc-width);
      height: 100%;

      position: absolute;
      top: 10rem;
      left: 100%;

      ul {
        width: 100%;
        height: auto;
        margin: 0;
        padding-left: 2.5rem;

        list-style: disc;

        position: sticky;
        top: 0;

        li::marker {
          color: var(--vp-c-brand-1);
        }

        ul {
          padding-left: 1.25rem;
        }
      }

      a {
        text-decoration: none;
      }
    }

    :deep(img),
    :deep(video) {
      width: 100%;
      max-width: ~"calc(@{max-width} - 3rem * 2)";
      margin: 0 auto;
    }

    .page-info {
      font-size: .8rem;
      color: var(--vp-c-text-2);
      :deep(p) {
        margin: 0;
      }
    }
  }

}
</style>
