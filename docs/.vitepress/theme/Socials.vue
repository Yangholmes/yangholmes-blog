<script lang="ts" setup>
import {useData} from 'vitepress';
import {computed} from 'vue';

import { VPSocialLink } from 'vitepress/theme';
import SocialIcon from './socialIcon/SocialIcon.vue';

const { theme, page, frontmatter } = useData();

const socialLinks = computed(() => {
  return theme.value.socialLinks;
});
</script>

<template>
  <ul class="socials">
    <li v-for="value in socialLinks" :key="value.link">
      <SocialIcon :icon="value.icon" :link="value.link" />
    </li>
  </ul>
</template>

<style lang="less" scoped>
.socials {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 1em;
}
</style>
