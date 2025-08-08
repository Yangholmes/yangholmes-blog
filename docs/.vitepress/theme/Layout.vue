<script lang="ts" setup>
import { useData } from 'vitepress';

import Sidebar from './Sidebar.vue';
import NotFound from './NotFound.vue';
import Home from './Home.vue';
import Page from './Page.vue';
import PostList from './PostList.vue';
import Footer from './Footer.vue';

import useLayout from './composables/useLayout';

const { page } = useData();

const layoutName = useLayout();

</script>

<template>
  <NotFound v-if="page.isNotFound"/>

  <div class="main-layout" v-else>
    <div class="leftside">
      <Sidebar />
    </div>
    <main class="content">
      <PostList v-if="layoutName === 'PostList'"/>
      <Home v-else-if="layoutName === 'Home'"/>
      <Page v-else />
    </main>
  </div>
</template>

<style lang="less" scoped>
.main-layout {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  .leftside {
    flex: 1;
    height: 100%;
    transition: flex .3s;
    position: relative;
  }

  .content {
    flex: 3;
    height: 100%;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: auto;
  }

  @media (width <= 840px) {
    .leftside {
      flex: 0;
    }
  }
}
</style>