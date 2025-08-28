<script lang="ts" setup>
import { defineSlots } from 'vue';
import {JSX} from 'vue/jsx-runtime';

const slots = defineSlots<{
  default: () => JSX.Element;
}>();
</script>

<template>
  <div class="mobile-only">
    <slot />
  </div>
</template>

<style lang="less" scoped>
.mobile-only {
  display: none;
  @media (width <= @max-width) {
    display: block;
  }
}
</style>
