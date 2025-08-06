<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from 'vue';
// import cx from 'classnames'

const x = ref(0);
const y = ref(0);
const blur = ref(3);
const width = ref(0);
const height = ref(0);
const center = ref([0, 0]);
const offset = 0.5;

function init() {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  center.value = [
    width.value / 2,
    height.value / 2
  ];
}

function onMouseMove(evt) {
  let position = {
      x: evt.clientX,
      y: evt.clientY
  };
  let delX = position.x - center.value[0];
  let delY = position.y - center.value[1];
  x.value = -1 * offset * delX;
  y.value = -1 * offset * delY;
  let b = 3 + Math.hypot(x.value, y.value) / 20;
  blur.value = b < 20 ? b : 20;
}

const controller = ref();
onMounted(() => {
  init();
  controller.value = new AbortController();
  const signal = controller.value.signal;
  window.addEventListener('mousemove', onMouseMove, {
    signal: signal
  });
  window.addEventListener('resize', init, {
    signal: signal
  });
})
onUnmounted(() => {
  controller.value.abort();
})

</script>

<template>
  <p class="notfound" :style="`filter: drop-shadow(${x}px ${y}px ${blur}px #aaa)`">404</p>
</template>

<style scope>
.notfound {
  padding: 0;
  margin: 0;

  display: block;
  font-size: 10vw;
  font-weight: 900;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

</style>
