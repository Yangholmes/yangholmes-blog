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
      createDate: post.createDate
        ? `写于 ${new Date(post.createDate).toLocaleDateString()}`
        : '忘记哪天写的了'
    }
  })
}, { immediate: true })


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
    <Footer />
  </div>
</template>

<style scoped>
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
</style>
