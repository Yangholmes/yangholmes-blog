<script lang="ts" setup>
import avatarImage from './cats.png'
</script>

<template>
  <div class="avatar">
    <a href="/">
      <div class="image" :style="`--image: url(${avatarImage})`" />
    </a>
    <p>Yangholmes</p>
    <p>
      邋遢和小松的
      <ruby>铲<rt>chǎn</rt></ruby><ruby>屎<rt>shǐ</rt></ruby><ruby>官<rt>guān</rt></ruby>
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
  gap: .1rem;

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
}
</style>
