<script lang="ts" setup>
import MobileOnly from './MobileOnly.vue';

const props = defineProps<{
  value: boolean;
  click: () => void;
}>();
</script>

<template>
  <MobileOnly>
    <div class="toggle-handler">
      <span
        class="icon"
        :class="`vpi-chevron-${props.value ? 'left' : 'right'}`"
        @click="props.click"
      />
    </div>
  </MobileOnly>
</template>

<style lang="less" scoped>
.toggle-handler {
  width: calc(var(--round-button-size) * 1);
  height: calc(var(--round-button-size) * 1.5);

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 0 4px 4px 0;

  background-color: var(--round-button-bg);
  backdrop-filter: saturate(50%) blur(2px);

  cursor: pointer;

  .icon {
    display: inline-block;
    color: var(--vp-c-divider);
  }
}
</style>
