---
createDate: 2022/08/21
---

# 变量声明和作用域

[[createDate]]

[[toc]]

JavaScript 的变量声明如此简单，只需要输入 `var`、 `let`、 `const` 关键字，甚至不需要声明变量的关键字，直接命名一个变量，就声明好了。但谁能想到，简简单单的变量声明，规矩这么复杂。js 的变量声明 和 C++ 的多重继承，是我学习编程过程中最难理解的两个知识点。

主要困惑的是变量声明和作用域的关系比较复杂。 `let` 和 `const` 特性比较像，无非一个声明可以修改的变量，一个声明不可修改的变量。主要的疑惑是 `let` 和 `var` 。

## 作用域不同

这是几个声明关键字的最核心区别。 `var` 作用域是函数， `let` 是块(block) 。什么是 “块” ？用一对花括号包裹起来的范围就是 “块” 。

| 关键字 | 作用域类型 |               特点               |
| :----: | :--------: | :------------------------------: |
|  var   | 函数作用域 |   在整个函数内有效，无视代码块   |
|  let   | 块级作用域 | 只在声明它的 ​`​{}` 代码块内有效 |

举例：

```JavaScript
// var 的函数作用域
function varTest() {
  if (true) {
    var a = 10; // 整个函数内有效
  }
  console.log(a); // ✅ 输出 10
}
varTest();

// let 的块级作用域
function letTest() {
  if (true) {
    let b = 20; // 仅在此代码块内有效
  }
  console.log(b); // ❌ ReferenceError: b is not defined
}
letTest();
```

## 变量提升

这是最难理解的一块。`var` 声明的变量是会提升的，除了 `var` 以外，使用 `function` 关键字声明函数也会提升。什么是提升？**提升**是指解释器在执行代码之前，似乎将函数、变量、类或导入的声明移动到其作用域的顶部的过程。举个例子：

```JavaScript
console.log(x); // ✅ undefined (不会报错)
var x = 5;

console.log(y); // ❌ ReferenceError: Cannot access 'y' before initialization
let y = 10;
```

这段代码

```JavaScript
console.log(x);
var x = 5;
```

好像被解析成

```JavaScript
var x;
console.log(x);
x = 5;
```

的样子。

这么看仿佛 `let`、 `const` 这类声明不具有变量提升的特性，但不够严谨，请看例子：

```JavaScript
const x = 1;
{
  console.log(x); // ReferenceError
  const x = 2;
}
```

如果认为 `const x = 2` 声明完全没有提升，那么 `console.log(x)` 应该读取上层作用域的 `x` 值，也就是应该输出 1 。然而，`const x = 2` “污染” 了整个块级作用域，`console.log(x)` 尝试读取 `const x = 2` 声明的 `x` ，但 `x` 尚未声明或初始化，抛出 `ReferenceError` 。不过，从实用角度看，将词法声明视为不提升可能更有用，因为这些声明的提升并没有带来任何有意义的特性。这种现象可以用另一个概念描述，从块级作用域开始到 `let` `const` `class` 关键字声明的区域，称为 **暂时死区(Temporal dead zone，TDZ)** 。当变量处于暂时性死区之中时，其尚未被初始化，并且任何访问其的尝试都将导致抛出 `ReferenceError` 。例如

```JavaScript
{
  // 暂时性死区始于作用域开头
  console.log(bar); // "undefined"
  console.log(foo); // ReferenceError: Cannot access 'foo' before initialization
  var bar = 1;
  let foo = 2; // 暂时性死区结束（对 foo 而言）
}
```

“暂时” 的含义是，死区的范围取决于代码执行的顺序，而非代码编写的顺序。这点和箭头函数的 `this` 指向完全不同。箭头函数的 `this` 指向取决于编写上下文，而非执行的上下文。

```JavaScript
{
  // 暂时性死区始于作用域开头
  const func = () => console.log(letVar); // 没问题

  // 在暂时性死区内访问 letVar 会抛出 `ReferenceError`

  let letVar = 3; // 暂时性死区结束（对 letVar 而言）
  func(); // 在暂时性死区外调用
}
```

| 关键字 |                 提升行为                 |                 结果                  |
| :----: | :--------------------------------------: | :-----------------------------------: |
|  var   | 声明提升到作用域顶部，初始化为 undefined |     可提前访问（值为 undefined）      |
|  let   |        声明提升但 ​​ 未初始化 ​​         | 提前访问 → ​​ 暂时性死区（TDZ）报错 ​ |

## 重复声明

在一个作用域内，`var` 可以重复声明，`let` 不行。

| 关键字 |         重复声明          |            全局污染            |
| :----: | :-----------------------: | :----------------------------: |
|  var   |   ​✅ 允许（覆盖原值）    | 成为 `window`/`global` 的属性  |
|  let   | ❌ 报错（SyntaxError） ​​ | 不会绑定到 `window`/`global` ​ |

在顶层作用域使用 `var` 定义变量，会自动将这个变量绑定在 `window` 对象中， `let` 不会这样。

```JavaScript
var x = "global";
let y = "global";
console.log(this.x); // "global"
console.log(this.y); // undefined
```

## 几个经典的例子

在 `switch` 结构体中，可能会遇到这种错误：

```JavaScript
let x = 1;

switch (x) {
  case 0:
    let foo;
    break;
  case 1:
    let foo; // ❌ SyntaxError: Identifier 'foo' has already been declared
    break;
}
```

块级作用域使用 `{}` 界定，要避免这个错误，用新的块将每个 case 条件封闭起来：

```JavaScript
let x = 1;

switch (x) {
  case 0: {
    let foo;
    break;
  }
  case 1: {
    let foo; // ✅ 0 errors
    break;
  }
}
```

另一个是 `for` 循环取值谜团：

```JavaScript
// i 在每次迭代中使用同一个变量
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 输出：3, 3, 3
}

// i 在每次迭代中创建新的变量
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 100); // 输出：0, 1, 2
}
```
