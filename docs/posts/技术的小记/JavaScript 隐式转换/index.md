---
createDate: 2025/08/13
title: JavaScript 隐式转换
tag: JavaScript
---

# JavaScript 隐式转换

[[createDate]]

## 令人头疼的问题

```JavaScript
[undefined] == false; // 这里输出 true 你敢信？
[undefined] === false; // 然而这里会输出 false ，why???
```

JavaScript 变量有下面这些特点：

1. 弱类型，且随时可以变换
2. 访问时会被相应类型的对象包裹，很难直接访问原始量
3. 除了几个特殊的类型外，所有变量看上去都是对象
4. 不同的类型可以放在一起计算，也可以放在一起比较

在对变量进行计算和比较的时候，代码执行器会自动将参与运算的变量转换成合适的值，这种转换不需要手动声明类型，完全由代码执行器在“桌子底下”操作，完全不透明，所以我们称其为变量的 **隐式转换**。

## 隐式转换

<!--@include: ./mermaid.md-->

> \[<span id="falsy">1</span>\] `document.all` 也是 falsy ，详见[文档](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)。
>
> \[<span id="toPrimitive">2</span>\] 非原始量 转 原始量 的方法也是一种 “**隐式转换**” 。首先会调用 `valueOf()` 函数，将返回值作为 原始量 ；如果函数没有返回值或返回值非原始量，则调用 `toString()` 函数。如果没有 `valueOf()` 或 `toString()` 函数，则会报错。

# 小试牛刀

分析一下开头那个逻辑对比：

```JavaScript
[undefined] == false;
```

是 原始量 和 非原始量 对比，先将 非原始量 转换成 原始量 ：

`[undefined]` => `[undefined].toString()` => `''`

变成了

`[undefined] == false` => `'' == false`

`string` 和 `boolean` 对比，将两边转换成 `number`：

`'' == false` => `0 == 0`

最终就是 `0 == 0` ，答案为 `true` 。

而 `[undefined] === false` 对比就比较简单了，`===` 是严格相等符号，符号两边必须类型和值完全一致才输出 `true` ，否则都是 `false` 。
