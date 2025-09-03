/// <reference types="vitepress/client" />

declare module '*.glb' {
  const content: string;
  export default content;
}
