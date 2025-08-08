<script lang="ts" setup>
import {useData, useRoute} from 'vitepress';
import {computed} from 'vue';
// import Search from 'vitepress-plugin-search/Search.vue';
import Search from './components/Search.vue';
import Socials from './components/Socials.vue';
import ThemeSwitch from './components/ThemeSwitch.vue';

const { theme } = useData();

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
      <ThemeSwitch />
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
    width: 100%;
    min-width: 208px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;

    background-color: var(--color--level-3);
    color: var(--c-text-light-1);
    font-weight: 900;
    font-size: 1.25rem;

    position: absolute;
    top: 0;
    left: 0;

    transform: translateX(0);
    transition: transform .3s;

    .top-bar,
    .bottom-bar {
      width: 100%;
      height: 3rem;
      padding-right: 3rem;

      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: .5rem;

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
      padding-right: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 1.25rem;

      li {
        text-align: right;

        &.active {
          color: var(--color--level-1);
        }
      }
    }
  }


@media (width <= 840px) {
  .sidebar {
    transform: translateX(-100%);
  }
}

</style>
