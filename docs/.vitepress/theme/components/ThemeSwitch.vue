<script lang="ts" setup>
import {useData} from 'vitepress';
import VPSwitchAppearance from 'vitepress/dist/client/theme-default/components/VPSwitchAppearance.vue';
import {inject} from 'vue';

const { isDark, theme } = useData()

const toggleAppearance = () => {
  isDark.value = !isDark.value
}
</script>

<template>
  <!-- <VPSwitchAppearance /> -->
  <div
    class="theme-switch"
    @click="toggleAppearance"
  >
    <span class="icon vpi-sun sun" />
    <span class="icon vpi-moon moon" />
  </div>
</template>

<style lang="less">
.theme-switch {
  width: 1.5em;
  height: 1.5em;

  border-radius: 9999em;
  border: 2px solid var(--vp-c-divider);
  background-color: var(--vp-c-gray-soft);

  position: relative;

  .icon {
    display: inline-block;
    color: var(--vp-c-divider);

    transition: opacity .2s !important;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .sun {
    opacity: 1;
  }

  .moon {
    opacity: 0;
  }
}

.dark {
  .sun {
    opacity: 0;
  }

  .moon {
    opacity: 1;
  }
}
</style>
