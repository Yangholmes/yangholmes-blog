<script lang="ts" setup>
import MobileOnly from './MobileOnly.vue';
import RoundButton from './RoundButton.vue';

const props = defineProps<{}>();

function onBack() {
  history.back();
}
</script>

<template>
  <div class="nav-bar">
    <RoundButton icon="arrow-left" @click="onBack" />
  </div>
</template>

<style lang="less" scoped>
.nav-bar {
  height: var(--tool-bar-height);
  padding-left: 3rem;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: .5rem;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}
</style>
