<script lang="ts" setup>
import {useData, useRoute} from 'vitepress'
import {ref, watch} from 'vue';
import {PostItem} from '../utils';

const { theme, page } = useData()
const route = useRoute();

const posts = ref<PostItem[]>([])

watch(() => route.path, (val) => {
  const category = page.value.relativePath.split('/')[0]
  posts.value = theme.value.posts[category].map((post) => {
    return {
      ...post,
      createDate: post.createDate ? new Date(post.createDate).toLocaleDateString() : '-'
    }
  })
}, { immediate: true })


</script>

<template>
  <div class="post-list">
    <Content />
    <ul class="list">
      <li v-for="post in posts" :key="post.url">
        <a :href="post.url">
          <p class="title">{{ post.title }}</p>
          <p class="meta">创建时间：{{ post.createDate }}</p>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.post-list {
  padding-left: 3em;
  margin: 3em 0;

  /* font-size: 1.2em; */

  .list {
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: flex-start;
    gap: 2em;

    .title {
      color: var(--color--level-5);
      font-size: 1.2em;
      font-weight: 600;
    }
    .meta {
      color: var(--color--level-3);
    }
  }
}
</style>
