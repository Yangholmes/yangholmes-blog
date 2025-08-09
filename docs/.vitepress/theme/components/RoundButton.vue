<script lang="ts" setup>
const props = defineProps<{
  icon: string;
  onClick?: () => void;
}>();
</script>

<template>
  <div class="round-button" @click="props.onClick">
    <span
      class="icon"
      :class="`vpi-${props.icon}`"
    />
  </div>
</template>

<style lang="less" scoped>
.round-button {
  width: var(--round-button-size);
  height: var(--round-button-size);

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 9999rem;
  // border: 2px solid var(--vp-c-divider);
  background-color: var(--round-button-bg);
  backdrop-filter: saturate(50%) blur(2px);

  cursor: pointer;

  &:hover {
    filter: drop-shadow(0 0 1px var(--vp-backdrop-bg-color));
  }

  .icon {
    display: inline-block;
    color: var(--vp-c-divider);
  }
}
</style>
