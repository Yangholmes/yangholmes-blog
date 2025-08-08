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
    class="round-button theme-switch"
    @click="toggleAppearance"
  >
    <span class="icon vpi-sun sun" />
    <span class="icon vpi-moon moon" />
  </div>
</template>

<style lang="less">
.theme-switch {
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
