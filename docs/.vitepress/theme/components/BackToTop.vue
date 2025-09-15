<script lang="ts" setup>
import {nextTick, onMounted, ref, onUnmounted} from 'vue';
import RoundButton from './RoundButton.vue';

const { container } = defineProps<{
  container: HTMLDivElement | null
}>();

const criticalHeight = ref(0);
const isShown = ref(false);

function onScrollTop() {
  if (!container) return;
  container.scrollTo({
    top: 0, behavior: 'smooth'
  })
}
function onScroll() {
  if (!container) return;
  const scrollPosition = container.scrollTop;
  isShown.value = scrollPosition > criticalHeight.value;
}

function onResize() {
  if (!container) return;
  criticalHeight.value = container.clientHeight / 3 * 2;
  onScroll();
}

const controller = ref<AbortController>();
onMounted(() => {
  nextTick().then(() => {
    onResize();
    if (!container) return;
    container.addEventListener('scroll', onScroll, { signal: controller.value?.signal });
    window.addEventListener('resize', onResize, { signal: controller.value?.signal });
  });
});

onUnmounted(() => {
  controller.value?.abort();
});

</script>

<template>
  <RoundButton
    class="back-to-top"
    :class="{
      'is-shown': isShown
    }"
    @click="onScrollTop"
    title="回到顶部"
    icon="arrow-up"
  />
</template>

<style lang="less" scoped>
.back-to-top {
  position: sticky;
  left: 100%;
  bottom: 20%;
  z-index: 4;

  opacity: 0;
  transition: opacity .3s;
  &.is-shown {
    opacity: 1;
  }
}
</style>
