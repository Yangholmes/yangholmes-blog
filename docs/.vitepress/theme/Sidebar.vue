<script lang="ts" setup>
import {useData, useRoute} from 'vitepress';
import {computed, ref, Teleport} from 'vue';
import Search from './components/Search.vue';
import Avatar from './components/avatar/Avatar.vue';
import Socials from './components/Socials.vue';
import ThemeSwitch from './components/ThemeSwitch.vue';
import SidebarToggleHandler from './components/SidebarToggleHandler.vue';

const { theme } = useData();

const route = useRoute();

const allCategories = computed(() => {
  return theme.value.categories;
})

const catInRoute = computed(() => {
  return decodeURIComponent(route.path.split('/')[1]);
})

const shownInMobile = ref(false);

function onToggle() {
  shownInMobile.value = !shownInMobile.value;
}

</script>

<template>
  <div
    class="sidebar"
    :class="{ 'shown-in-mobile': shownInMobile }"
  >
    <SidebarToggleHandler
      class="handler"
      :value="shownInMobile"
      @click="onToggle"
    />
    <div class="top-bar">
      <ThemeSwitch />
      <Search class="search" />
    </div>
    <nav>
      <Avatar />
      <ul class="category-list">
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
      <Socials />
    </nav>
    <div class="bottom-bar">
      <!-- <Socials /> -->
    </div>
    <Teleport to="body">
      <div
        class="overlay"
        :class="{ 'shown-in-mobile': shownInMobile }"
        @click="onToggle"
      />
    </Teleport>
  </div>
</template>

<style lang="less" scoped>
  .sidebar {
    width: 100%;
    min-width: var(--side-bar-min-width);
    height: 100%;
    // padding-top: calc(var(--tool-bar-height) + 10rem);

    display: flex;
    flex-direction: column;
    align-items: flex-end;
    // justify-content: flex-start;
    justify-content: center;

    background-color: var(--color--level-3);
    color: var(--c-text-light-1);
    font-weight: 900;
    font-size: 1.25rem;

    position: absolute;
    top: 0;
    left: 0;
    z-index: 11;

    transform: translateX(0);
    transition: transform .3s;

    .handler {
      position: absolute;
      top: 50%;
      left: 100%;
      transform: translateY(-50%);
    }

    .top-bar,
    .bottom-bar {
      width: 100%;
      height: var(--tool-bar-height);
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

    nav {
      padding-right: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2.5rem;

      ul.category-list {
        display: flex;
        flex-direction: column;
        align-items: column;
        gap: 1.25rem;

        li {
          text-align: center;
          transition: color .3s;

          &:hover,
          &.active {
            color: var(--color--level-1);
          }
        }
      }
    }
  }

@media (width <= 840px) {
  .sidebar {
    transform: translateX(-100%);

    &.shown-in-mobile {
      transform: translateX(0);
    }

  }
  .overlay {
    width: 100%;
    height: 100%;

    display: none;
    background-color: rgba(0, 0, 0, .5);
    backdrop-filter: saturate(50%) blur(1px);

    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;

    &.shown-in-mobile {
      display: block;
    }
  }
}

</style>
