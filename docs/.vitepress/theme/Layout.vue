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
    <Sidebar />
    <div class="content">
      <PostList v-if="layoutName === 'PostList'"/>
      <Home v-else-if="layoutName === 'Home'"/>
      <Page v-else />
    </div>
  </div>
</template>

<style lang="less" scoped>
.main-layout {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  .content {
    flex: 3;
    height: 100%;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: auto;
  }
}
</style>