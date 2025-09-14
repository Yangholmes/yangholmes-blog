---
createDate: 2025/07/12
title: JavaScript 变量类型判断
tag: JavaScript
---

# JavaScript 变量类型判断

[[createDate]]

[[toc]]

## JavaScript 数据类型

JavaScript 是一种变量类型不敏感的语言，在使用变量的过程中，难免需要对其类型进行判断。但是 JavaScript 没有严格定义基本类型，自顶向下看，只有 **`Primitive`**（原始值，或者叫原始数据类型） 和 **`object`** 两种类型。区分 原始值 和 object 的方法很简单，原始值不具有属性和方法，但 object 有。原始值**不可修改**，是 JavaScript 最底层的数据类型表示，开发者在日常开发中，很难直接接触到原始值，每次需要访问原始值时， JavaScript 会自动地构造一个对象将原始值封装起来。举个例子，字符串 `'foo'` 是原始值，当运行代码 `'foo'.includes('f')` 时，创建 `String` 自动地将 `'foo'` “包裹”起来，`'foo'` 本身不具有任何方法和属性，实际上是在访问 `String.prototype.includes()` 。

> 原始值 （Primitive）有 7 种：

- string
- number
- bigint
- boolean
- undefined
- symbol
- null

除了 `undefined` 和 `null` 外，不同的原始值会被封装成不同的对象，为访问原始值提供丰富且实用的途径。所以直接尝试访问 `null` 和 `undefined` 的属性方法会发生错误，这也就验证了原始值并不具备属性和方法的特性。

| Type      | Object wrapper |
| --------- | -------------- |
| Null      | N/A            |
| Undefined | N/A            |
| Boolean   | Boolean        |
| Number    | Number         |
| BigInt    | BigInt         |
| String    | String         |
| Symbol    | Symbol         |

除了原始值本身，原始值还可以组成各种集合，比如说数组、日期。JavaScript 同样是提供丰富的内置对象来表示这些类型（`Array`、 `Date` 等）。这些对象的原型，无一例外都是 `Object` 的原型，甚至用于表示函数的 `Function` ，其原型也是 `Object` 的原型。

所以，对 JavaScript 变量类型的检查，归根结底就是**对变量原始值和原型的检查**。

## 类型检查方案

### `typeof`

`typeof` 返回被检查变量操作数值的类型。

用法

```
typeof operand
```

```javascript
console.log(typeof true);
// 输出 "boolean"
```

| Type             | Result      |
| ---------------- | ----------- |
| Undefined        | "undefined" |
| Null             | "object"    |
| Boolean          | "boolean"   |
| Number           | "number"    |
| BigInt           | "bigint"    |
| String           | "string"    |
| Symbol           | "symbol"    |
| Function         | "function"  |
| Any other object | "object"    |

这是用于检查变量原始值最直接的方式。由于历史原因， `null` 会被判别为 `object` ，这是一个 bug 。一开始 JavaScript 值的存储被设计成 类型 tag + 值 的结构，object 的类型 tag 被设计成 `000` ，null 表示空指针，被指向内存 `0x00` 的位置， 最终 null 和 object 的类型标签都是 `000` ，typeof 实现中，000 标签只检查了值是否可执行（可执行的对象是 function ，不可执行就是 object ），导致 `typeof null` 的结果是 `'object'` 。

> 关于 `null` 被识别成 `object` 的历史原因，可以参考[这篇文章](https://2ality.com/2013/10/typeof-null.html)。

`typeof` 的优势是简单，劣势是无法检查除 function 外的其他内置对象，更不能检查开发者自己创建的对象，检查 null 时需要编写额外的代码。

### `instanceof`

`instanceof` 用来检查实例的构造函数原型是否在给定构造函数的原型链上。

用法

```
object instanceof constructor
```

```javascript
function Man(age) {
  this.age = age;
}
const k = new Man(30);

console.log(k instanceof Man);
// 输出 true

console.log(k instanceof Object);
// 同样输出 true
```

上文提到过，所有对象都是从 `Object` 的原型继承而来的，所以任何实例原型链上应该都会存在 `Object` 的原型。具体来说，当执行 `object instanceof constructor` 时，执行器会去找对象实例中是否有 `Symbol.hasInstance` 函数，如果有，执行这个函数并返回 `Boolean` 结果；如果没有，则从构造函数开始往原型链顶端寻找，直到最开始的 object 为止。

使用 `Symbol.hasInstance` 可以修改原型链，这也就意味着 instanceof 的结果可能“不准确”，例如：

```javascript
class FakeArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof FakeArray);
// 输出 true
```

`instanceof` 用来检查实例的类型很方便好用，可能会遍历整个原型链，但是无法用来检查 `null` 和 `undefined` ，也可能由于修改了 `Symbol.hasInstance` 导致检查结果不准确。

### `constructor`

实例的 `constructor` 属性指向创建这个实例的构造函数。

用法：

```
obj.constructor
```

任何对象实例都具有构造函数（除非特意构造一个原型指向 null 的对象），利用这个属性可以轻松地获取到实例的构造函数类型，且可以避免整个原型链的遍历。

### `Object.prototype.toString.call()`

对象的 `toString` 方法返回当前对象的字符串表达。

`Object` 实例的字符串表达是 `'[object Object]'` 。`toString` 是可以修改的，在不同的对象实现中，返回的字符串表达不尽相同，比如字符串对象返回的是原始值，数组对象返回的是 `Array.protype.join(',')` 。只有原型链顶端，原汁原味的 `Object.prototype.toString` 返回对象类型 `'[object Type]'` 。利用这个特性，可以通过 `Object.prototype.toString.call(obj)` 获取到对象的类型。和 instanceof 一样，`toString` 也可能不准确，因为类型描述同样可以修改：

```javascript
class FakeArray {
  get [Symbol.toStringTag]() {
    return "Array";
  }
}

console.log(Object.prototype.toString.call(new FakeArray()));
// 输出 '[object Array]'
```

## 总结

| 方法        | 优势                                 | 劣势                                                                                                 | 场景                                             |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| typeof      | 通俗易懂，原始值检查最方便           | 无法检查 null ，也无法检查各种对象                                                                   | 接口数据通常是原始值，非常适合这个场景的类型检查 |
| instanceof  | 遍历整个原型链，任何一个类型都不放过 | null 、 undefined 和原始值无法检查，可以被修改结果不准确                                             | 对象类型检查普遍适用                             |
| constructor | 构造函数不会被修改，准确             | 构造函数为 null 的对象会出错，需要引入构造函数做对比，如果构造函数立即执行且不具名，使用起来比较麻烦 | 对象类型检查普遍适用                             |
| toString    | 返回结果是描述，使用方便             | 代码冗长，可能被修改结果                                                                             | 对象类型检查普遍适用                             |

没有一种方案是“银弹”，需要组合其中几种方案来识别任意变量的类型。mozilla 提供了一种非常详尽的[示例](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#custom_method_that_gets_a_more_specific_type)，可以作为变量判断的参考。
