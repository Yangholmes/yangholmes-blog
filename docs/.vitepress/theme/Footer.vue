<script lang="ts" setup>
const thisYear = new Date().getFullYear();
</script>

<template>
  <div class="footer">

    <p>
      @ 2017 ~ {{ thisYear }} • © Yangholmes
    </p>
    <p>
      使用
      ❤️ <a href="https://vitepress.dev/" target="_blank">Vitepress</a>
      搭建 - Yangholmes 提供主题
    </p>

  </div>
</template>

<style lang="less" scoped>
.footer {
  width: 100%;
  height: auto;
  padding: 3.5em 0;
  margin-top: 3em;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5em;

  background-color: var(--color--level-2);
  border: 2px solid var(--color--level-3);
  border-radius: 20px;

  p {
    margin: 0;
  }
}
</style>
