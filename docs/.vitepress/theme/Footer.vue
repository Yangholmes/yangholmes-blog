<script lang="ts" setup>
const thisYear = new Date().getFullYear();
</script>

<template>
  <div class="footer">
    <p>
      © 2017 ~ {{ thisYear }} • Yangholmes
    </p>
    <p class="driver">
      使用
      ❤️ <a href="https://vitepress.dev/" target="_blank">Vitepress</a>
      搭建 - Yangholmes 提供<a href="/renovation-progress">主题</a>
    </p>
  </div>
</template>

<style lang="less" scoped>
.footer {
  width: 100%;
  height: auto;
  padding: 2rem;
  margin-top: 3rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;

  background-color: var(--color--level-2);
  border: 2px solid var(--color--level-3);
  border-radius: 20px;

  :deep(p) {
    margin: 0;
    font-size: 1rem;

    &.driver {
      font-size: .7rem;
    }

    a {
      color: var(--color--level-4);
    }
  }
}
</style>
