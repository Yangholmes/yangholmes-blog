<script lang="ts" setup>
import {useRoute, useRouter} from 'vitepress';
import useLayout from '../composables/useLayout';
import MobileOnly from './MobileOnly.vue';
import RoundButton from './RoundButton.vue';

// const props = defineProps<{}>();

const layoutName = useLayout();

const route = useRoute();
const router = useRouter();

function onBack() {
  const { path } = route
  const upPath = path.split('/')[1]
  router.go(`/${upPath}`)
}
</script>

<template>
  <div class="nav-bar">
    <template v-if="layoutName === 'Page'">
      <RoundButton
        icon="arrow-left"
        @click="onBack"
      />
    </template>
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
