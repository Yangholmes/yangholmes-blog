---
createDate: 2021/01/13
title: 什么是原型链
---

# 什么是原型链

**2021-01-13**

原型链是 JavaScript 最基本的概念之一。想要搞明白什么是原型链也不是那么容易的事情，MDN 上有一篇关于[继承和原型链的文章](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)，把原型链解释得很清楚，但是官方文档缺乏总结，看完之后可能只有一个模糊的概念，还是不能清晰地解释出，什么是原型链。

那么，简单少字的总结他来了：

1. **原型链**用来描述对象之间的关系
2. **prototype** 是函数的特殊属性，指向它的原型对象<sup>\[1\]</sup>
3. **原型**是对象的一个属性，指向其构造函数的 prototype 属性，即构造函数的原型对象<sup>\[2\]</sup>
4. 几乎所有对象都是位于原型链顶端的 Object 的实例，所以一个普通对象的原型就像一根**链**一样，最终会指向 Object 的原型对象
5. Object 的原型对象也有原型，指向 null ，根据定义，null 没有原型，所以原型链的**终点**就是 null <sup>\[3\]</sup>

---

**show me your code：**

\[1\]：我们可以看看字符串对象的例子

执行代码

```javascript
console.log(String);
console.log(String.prototype);
```

可以得到类似的输出

```javascript
ƒ String() { [native code] }
String {"", constructor: ƒ, anchor: ƒ, big: ƒ, blink: ƒ, …}
```

\[2\]：继续看字符串的例子

```javascript
let str = new String("str");
console.log(str);
console.log(Object.getPrototypeOf(str));
console.log(Object.getPrototypeOf(str) === String.prototype);
```

可以得到类似的输出

```javascript
String {"str"}
String {"", constructor: ƒ, anchor: ƒ, big: ƒ, blink: ƒ, …}
true
```

\[3\]：直接访问一下 `Object` 原型对象的原型

```javascript
console.log(Object.getPrototypeOf(Object.prototype));
```

```javascript
null;
```
