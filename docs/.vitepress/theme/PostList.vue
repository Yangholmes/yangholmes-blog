<script lang="ts" setup>
import {useData} from 'vitepress'
import {computed} from 'vue';
import dayjs from 'dayjs';

import { PostItem } from '../utils';
// @ts-ignore
import { data } from './data/posts.data';

const { page } = useData();

const posts = computed(() => {
  const category = page.value.relativePath.split('/')[0]
  return data.posts[category].map((post: PostItem) => {
    return {
      ...post,
      createDate: post.createDate
        ? `写于 ${dayjs(post.createDate).format('YYYY年MM月DD日')}`
        : '忘记哪天写的了'
    }
  }) as PostItem[]
})

</script>

<template>
  <div class="post-list">
    <Content />
    <ul class="list">
      <li class="item" v-for="post in posts" :key="post.url">
        <a :href="post.url">
          <p class="title">{{ post.title }}</p>
          <p class="meta">{{ post.createDate }}</p>
          <!-- <p>{{ post.excerpt }}</p> -->
        </a>
      </li>
    </ul>
  </div>
  <div class="footer-con">
    <Footer />
  </div>
</template>

<style lang="less" scoped>
.post-list {
  padding: 0 3rem;
  margin: 3rem 0;

  /* font-size: 1.2rem; */

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
        color: var(--color--level-3);
      }
    }
  }
}

.footer-con {
  padding: 0 3rem 3rem 3rem;
  position: sticky;
  top: 100%;
}
</style>
