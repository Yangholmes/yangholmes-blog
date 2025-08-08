<script lang="ts" setup>
import Search from 'vitepress-plugin-search/Search.vue';
</script>

<template>
  <Search class="plugin" />
  <!-- <div class="search">
    <span class="icon vpi-search" />
  </div> -->
</template>

<style lang="less" scoped>
.plugin {
  :deep(.DocSearch-Button) {
    border-radius: 9999em;
  }
}

// .search {
//   width: 1.5em;
//   height: 1.5em;

//   border-radius: 9999em;
//   border: 2px solid var(--vp-c-divider);
//   background-color: var(--vp-c-gray-soft);

//   position: relative;

//   .icon {
//     display: inline-block;color: var(--vp-c-divider);

//     transition: opacity .2s !important;

//     position: absolute;
//     top: 50%;
//     left: 50%;
//     transform: translate(-50%, -50%);
//   }
// }
</style>
