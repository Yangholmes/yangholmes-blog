<script lang="ts" setup>
import {useData} from 'vitepress';

const { theme } = useData();

const avatarImage = theme.value.whoami.avatar || null;

const name = theme.value.whoami.name || null;

const description = theme.value.whoami.description || null;

</script>

<template>
  <div class="avatar">
    <a
      v-if="avatarImage"
      href="/"
    >
      <div class="image" :style="`--image: url('${avatarImage}')`" />
    </a>
    <p v-if="name" class="name">
      {{name}}
    </p>
    <p v-if="description" class="description">
      {{ description }}
      <!-- 邋遢和小松的
      <ruby>铲<rt>chǎn</rt></ruby><ruby>屎<rt>shǐ</rt></ruby><ruby>官<rt>guān</rt></ruby> -->
    </p>
  </div>
</template>

<style lang="less" scoped>
.avatar {
  width: auto;
  // padding-bottom: 1rem;

  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: .5rem;

  font-size: 1rem;
  font-weight: 600;
  color: var(--color--level-2);

  // border-bottom: 1px solid var(--color--level-1);

  a {
    display: inline-block;
  }

  .image {
    width: 7rem;
    height: 7rem;

    border: 2px solid var(--color--level-1);
    background-color: var(--color--level-5);
    backdrop-filter: saturate(50%) blur(2px);

    background-image: var(--image);
    background-size: cover;
    border-radius: 9999rem;
  }

  .name {
    font-size: 1.25rem;
  }

  .description {
    font-size: .85rem;
  }
}
</style>
