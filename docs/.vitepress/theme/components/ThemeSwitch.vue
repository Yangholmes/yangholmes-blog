<script lang="ts" setup>
import {useData} from 'vitepress';
import RoundButton from './RoundButton.vue';

const { isDark } = useData()

const toggleAppearance = () => {
  isDark.value = !isDark.value
}
</script>

<template>
  <div
    class="theme-switch"
    :class="{ 'is-dark': !isDark }"
    @click="toggleAppearance"
  >
    <RoundButton
      class="switch sun" icon="sun"
    />
    <RoundButton
      class="switch moon" icon="moon"
    />
  </div>
</template>

<style lang="less" scoped>
.theme-switch {
  position: relative;

  .switch {
    transition: opacity .3s;
  }

  .sun {
    opacity: 1;
    position: absolute;
    top: 0;
    left: 0;
  }

  .moon {
    opacity: 0;
  }

  &.is-dark {
    .sun {
      opacity: 0;
    }
    .moon {
      opacity: 1;
    }
  }
}
</style>
