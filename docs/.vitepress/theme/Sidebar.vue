<script lang="ts" setup>
import {useData, useRoute} from 'vitepress';
import {computed} from 'vue';
import Search from 'vitepress-plugin-search/Search.vue';
import Socials from './Socials.vue';

const { theme, page, frontmatter } = useData();

const route = useRoute();

const allCategories = computed(() => {
  return theme.value.categories;
})

const catInRoute = computed(() => {
  return decodeURIComponent(route.path.split('/')[1]);
})

</script>

<template>
  <div class="sidebar">
    <div class="top-bar">
      <Search class="search" />
    </div>
    <ul class="nav">
      <li
        v-for="cat in allCategories"
        :key="cat"
        :class="{ active: cat === catInRoute }"
      >
        <a :href="`/${cat}/`">
          {{ cat }}
        </a>
      </li>
    </ul>
    <div class="bottom-bar">
      <Socials />
    </div>
  </div>
</template>

<style lang="less" scoped>
  .sidebar {
    flex: 1;
    height: 100%;

    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;

    background-color: var(--color--level-3);
    color: #FFF;
    font-weight: 900;
    font-size: 1.25em;

    position: relative;

    .top-bar,
    .bottom-bar {
      width: 100%;
      height: 3em;

      display: flex;
      justify-content: center;
      align-items: center;

      position: absolute;
    }

    .top-bar {
      top: 0;
      .search {
        flex: none;
        padding: 0;
        color: var(--color--level-5);
      }
    }

    .bottom-bar {
      bottom: 0;
    }

    ul.nav {
      padding-right: 3em;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 1.25em;

      li {
        text-align: right;

        &.active {
          color: var(--color--level-1);
        }
      }
    }
  }

</style>
