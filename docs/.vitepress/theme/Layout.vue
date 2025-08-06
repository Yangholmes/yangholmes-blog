<script lang="ts" setup>
import { useData } from 'vitepress';

import Sidebar from './Sidebar.vue';
import NotFound from './NotFound.vue';

import useLayout from './composables/useLayout';
import {onMounted} from 'vue';


const { page } = useData();

const activeLayout = useLayout();

</script>

<template>
  <NotFound v-if="page.isNotFound"/>

  <div class="main-layout" v-else>
    <Sidebar />
    <div class="content">
      <Suspense>
        <component :is="activeLayout" />
        <template #fallback>
          <div class="loading">Loading...</div>
        </template>
      </Suspense>
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
    justify-content: flex-start;
    overflow: auto;
  }
}
</style>