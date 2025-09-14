<script lang="ts" setup>
import {useData} from 'vitepress';
import {computed} from 'vue';

const { frontmatter } = useData();

const tags = computed(() => {
  const raw = frontmatter.value.tags;
  if (typeof raw === 'string') {
    return raw.split(',').map(e => e.trim());
  } else if (Array.isArray(raw)) {
    return raw.map(e => e.trim());
  }
  return [];
});
</script>

<template>
  <p
    class="related-tags"
    v-if="tags.length"
  >
    标签:
    <span class="tag-list">
      <span v-for="tag in tags" :key="tag">
        <a :href="`/tag/${tag}`" rel="noopener noreferrer">
          {{ tag }}
        </a>
      </span>
    </span>
  </p>
</template>

<style lang="less" scoped>
.related-tags {
  .tag-list {
    margin-left: .5rem;
    display: inline-flex;
    flex-direction: row;
    gap: .5rem;
  }
}
</style>
