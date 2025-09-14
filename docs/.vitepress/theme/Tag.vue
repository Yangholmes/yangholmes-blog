<script lang="ts" setup>
import { useData, Content } from 'vitepress';
import {Ref} from 'vue';
import dayjs from 'dayjs';

import {TagPostList} from '../../posts/tag/[tag].paths';

const params = useData().params  as Ref<TagPostList[number]['params']>;

const posts = params.value.posts.map(post => {
  return {
    ...post,
    createDate: post.createDate
      ? `写于 ${dayjs(post.createDate).format('YYYY年MM月DD日')}`
      : '忘记哪天写的了'
  }
});
</script>

<template>
  <div class="post-list">
    <h1>#标签: {{ params.tag }}</h1>
    <Content />
    <ul class="list">
      <li class="item" v-for="post in posts" :key="post.url">
        <a :href="`/${post.url}`">
          <p class="title">{{ post.title }}</p>
        </a>
        <p class="meta">
          <span>
            分类: <a v-if="post.category" :href="`/${post.category}/`">{{ post.category }}</a>
            <span v-else>-</span>
          </span>
          <span>
            {{ post.createDate }}
          </span>
        </p>
      </li>
    </ul>
    <Footer />
  </div>
</template>

<style lang="less" scoped>
.post-list {
  padding: 0 3rem;
  margin: 3rem 0;

  :deep(h1) {
    margin-bottom: 2rem;
    font-size: 1.5rem;
    font-weight: 900;
  }

  .list {
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: flex-start;
    gap: 2rem;

    .item {

      .title {
        color: var(--color--level-5);
        font-size: 1.2rem;
        font-weight: 600;
      }
      .meta {
        display: flex;
        gap: 1rem;
        color: var(--color--level-3);
      }
    }
  }
}
</style>
