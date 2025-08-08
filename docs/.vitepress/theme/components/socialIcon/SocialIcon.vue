<script lang="ts" setup>
import {ref, watch} from 'vue';

const props = defineProps<{
  icon: string;
  link: string;
}>();

const iconSrc = ref('')

watch(() => props.icon, (val) => {
  import(`./logos/${val}.svg`).then((module) => {
    iconSrc.value = `url("${module.default}")`
  })
}, { immediate: true });

</script>

<template>
  <a :href="props.link" target="_blank" rel="noopener noreferrer">
    <div
      class="social-icon"
      :style="`--mask-image: ${iconSrc}`"
    >
    </div>
  </a>
</template>

<style lang="less">
.social-icon {
  width: 1em;
  height: 1em;
  background-color: var(--color--level-5);

  mask-image: var(--mask-image);
  mask-size: 100% auto;
  mask-position: center;
  mask-repeat: no-repeat;
}
</style>
