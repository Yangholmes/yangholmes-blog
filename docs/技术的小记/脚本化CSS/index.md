---
createDate: 2016/05/09
---

# 脚本化 CSS

[[createDate]]

CSS 即 层叠样式表，Cascading Style Sheet 的首字母缩写，是一种指定 HTML 文档外观表现的标准，目前流行的是 CSS3。

CSS 本身是为设计师准备的，它用来规定 HTML 文档的外观。JavaScript 开发人员对 CSS 的兴趣在于，当通过 JS 脚本化 CSS 之后，能够实现许多有趣的视觉效果——例如“滑入”、“淡出”、“震动”等效果。

创建类似这些效果的技术以前被称作 动态 HTML，即 DHTML，不过这个术语现在已经过时了。

### 为什么叫做“层叠”样式表？

CSS 中，C 表示 Cascading，层叠。这个词语的含义就是，应用于文档中的任何给定元素，其样式是各个来源的“层叠”效果。这里说的“来源”是指：

1. Web 浏览器默认样式表
2. 文档的样式表
3. 每个独立的 HTML 元素的 style 属性

### 1、脚本化内联样式

1. 类似于大多数 HTML 属性，style 也是元素对象的属性。
2. 内联样式简单粗暴，直接了当：
   `element.stlye.property`
   `element.style`将会返回一个 CSSStyleDeclaration 对象。
3. 内联样式脚本一般只用于修改样式，查询样式的时候一般会使用计算样式(稍后介绍)。
4. 内联样式脚本只能修改内联样式，无法修改嵌入的样式和外部的样式。
5. 当时用内联样式脚本修改样式时，它将会覆盖样式表中的所有样式(Cascading)。

### 2、计算样式

1. 计算样式通常用于读取元素对象的样式：

   `getComputedStyle(element, pseudo)`

   参数 element 指元素对象，pseudo 指伪元素，必须指定，通常为 null 或者空字符，如果想要获取伪元素的样式，就应该传入 CSS 伪元素的字符串，如“:after”、“:before”等。

   `getComputedStyle(element, pseudo)`也将会返回一个 CSSStyleDeclaration 对象。

2. 计算样式只读。

3. 计算样式是 内联样式 和所有 外部样式 的总样式。

4. 值是绝对值，例如查询 fontSize，只会返回像素值而不会返回 em 值。

5. 不计算复合属性，如不要查询 margin，而是查询 marginLeft 或者 marginTop。

6. 计算样式的 cssText 属性未定义。

7. IE8 及其以前版本没有`getComputedStyle()`方法，但存在类似用于查询计算样式的`element.currentStyle`属性。

### 3、以上总结

1. 查询样式选用 `getComputedStyle()` ；

2. 修改样式选用 `element.style.property = xxx `。

### 4、脚本化 CSS 类

既然 CSS 查询修改并没有那么方便，何不先写好 CSS，然后去脚本化元素对象的 class 呢？

### 5、脚本化样式表

1. 使用脚本创建一个新的样式表，你可以：

- 利用元素对象`<style>`或者`<link>`
- 利用 CSSStyleSheet 对象，它表示样式本身：
  `document.styleSheets[]`

  2.CSSStyleSheet 对象

CSSStyleSheet 对象有 10 个属性，其中 9 个如下，另外一个属性 rules[]存在于 IE 浏览器中，是一个和 cssRules 相同的属性，只不过属性名不同。

- cssRules
  以类数组的形式返回样式表中所有 CSS 规则。

- disabled
  该属性指示是否已应用当前样式表。如果为 true，样式表被关闭，且不能应用于文档。如果为 false，样式表打开并且可以应用于文档。

- href
  返回样式表的位置（URL），如果是内联样式表，则为 null。

- media
  规定样式信息预期的目标媒介。

- ownerNode
  返回将该样式表与文档相关联的节点。

- ownerRule
  如果该样式表来自 @import 规则，ownerRule 属性将包含 CSSImportRule。

- parentStyleSheet
  返回包含该样式表的样式表（如果有的话）。

- title
  返回当前样式表的标题。标题可以通过引用该样式表的 `<style>` 或 `<link>` 元素的 title 属性来指定。

- type
  规定该样式表的样式表语言。以 MIME 类型表示，CSS 样式表的类型为 "text/css"。

在标准 API 中，CSSRule 对象代表所有 CSS 规则，包含如 `@import` 和 `@page` 等指令，但在 IE 中，rules[]数组只包含样式表中实际存在的样式规则。

CSSStyleSheet 对象还拥有两个方法，分别是 insertRule()和 deleteRule()，在 IE 中并不支持这两个方法，但是有相同功能的 addRule()和 removeRule()方法。使用上也有些许不同，原型为：

`insertRule(rule,index)`
rule：要添加到样式表的规则的完整的、可解析的文本表示。
index：要把规则插入或附加到 cssRules 数组中的位置。

`addRule(selector,style,index)`
selector：规则的 CSS 选择器。
style：应用于匹配该选择器的元素的样式。这个样式字符串是一个分号隔开的属性：值对的列表。并没有使用花括号开始或结束。
index：规则数组中插入或附加规则的位置。如果这个可选参数被省略掉，则新的规则会增加到规则数组的最后。

`deleteRule(index)`和`removeRule(index)`用法相同，index 均为 CSSRules（rules[]）的元素索引。
