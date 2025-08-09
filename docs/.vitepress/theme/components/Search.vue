<script lang="ts" setup>
import Search from 'vitepress-plugin-search/Search.vue';
import RoundButton from './RoundButton.vue';

</script>

<template>
  <Search class="plugin">
    <RoundButton icon="search" />
  </Search>
</template>

<style lang="less" scoped>
.plugin {
  :deep(.DocSearch-Button) {
    border-radius: 9999rem;
  }
}
</style>
