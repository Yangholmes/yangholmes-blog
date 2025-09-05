---
createDate: 2025/09/02
---

# WebAssembly 基础（二）

[[createDate]]

> 本系列是读书笔记第二篇，比较零散

[[toc]]

这篇介绍 wat 语法。

## wasm 二进制格式结构

和其他二进制格式一样，wasm 二进制格式也是以 **魔术数**+**版本号** 开头（ **Magic Number** + **Version** ），其他模块按照不同的类别聚合放在不同的**段**（ **Segment** ）中，**严格按照顺序排列**，分配 ID 。wasm 一共有 12 个段，魔术数 和 版本号 没有分配 ID ，位于开头，其他段均有 ID ，范围是 1~11 ，ID 0 特殊，不需要按照顺序出现。二进制文件格式对人类阅读不友好，这里详细展开讨论，只介绍每个段的功能。

![wasm 二进制格式结构](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/adcn7shhps4cxd1xbiyq.png)

### 0. 自定义段 Custom Section

自定义段是可以用来存放任何数据，比如提供给编译器等工具使用，记录函数名等调试信息。这个段在模块中可有可无，wasm 不执行自定义段也不会出错。另外，虽然自定义段的 ID 是 0 ，但不必要出现在开头或者结尾，可以出现在任何一个非自定义段的前面或者后面，且可以存在多个自定义段。常见的内容有 sourceMap 链接、DWARF 调试信息。

### 1. 类型段 Type Section

列出模块中所有函数原型（或者说函数签名、函数类型），即函数的参数和返回值。类似 C 的头文件。

### 2. 导入段 ​​Import Section

列出模块所有导入项，包括函数、内存、表、全局变量。

### 3. 函数段 Function Section

列出内部函数对应的签名索引。

### 4. 表段 Table Section

定义模块使用的表，如函数引用。 wasm v1.0 规定只有一张表，v2.0 表数量可以有多个。

### 5. 内存段 Memory Section

列出模块使用的线性内存，包括内存的初始页数、最大页数、内存数量。wasm v1.0 规定一个模块只能有一块内存，v2.0 内存数量可以有多个。

### 6. 全局段 Global Section

定义全局变量及其初始值。

### 7. 导出段 ​​Export Section

声明模块对外暴露的对象。

### 8. 起始段 ​​Start Section

指定起始函数，类似于 C 的 `main` 函数，在模块初始化时自动执行。

### 9. 元素段 Element Section

表的初始化数据。

### 10. 代码段 Code Section

所有函数的二进制指令。函数段（ID 3）和代码段（ID 10）必须一一对应。

### 11. 数据段 Data Section

初始化线性内存。

其中，类型段（1）、函数段（3）、代码段（10）是必需的，其他段可以省略，自定义段不参与代码执行。3 和 10 对应，4 和 9 对应，5 和 11 对应。

因为 wasm 具有**严格的段顺序**，**支持流式加载**，所以 wasm 可以一边加载，一边解析，一边验证，一边编译，初始化效率非常高。

wasm 二进制格式采用小端方式（Little-Endian）编码，wasm 的魔术数为 `\0asm` ，占 4 个字节，版本号也占 4 个字节，`\0asm` 十六进制编码为 `0x6D736100` ，版本为 1 十六进制编码为 `0x00000001` 。在 wasm 文件中编码为

```
00 61 73 6D 01 00 00 00
```

wasm 采用 [LEB128](https://en.wikipedia.org/wiki/LEB128) 编码整数值，采用 [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) 编码浮点数值。 LEB128 是一种变长码压缩，可以减少整型数的存储空间，压缩代码；IEEE 754 是常用的浮点数储存方法，这两个编码方式这里不展开。

![wasm binary code](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yv9hjhgge9jqdwdv3kn2.png)

## wat 语法

wat 是 wasm 文本格式（ WebAssembly Text ），基于 **S-Expression** 的一种嵌套括号结构，是 wasm 等效的文本形式，失去了 wasm 严格的段顺序，取而代之的是更容易阅读的表达式顺序。wat 和 wasm 之间可以使用 [`wabt`](https://github.com/WebAssembly/wabt) 工具转换。这里介绍一下 wat 核心语法结构。

> S 表示 symbolic ，符号的。

### 1. 模块定义 Module

一个 wasm/wat 文件定义一个模块，以 `(module ...)` 代码包裹：

```wasm
(module
  ;; 内部包含：函数、内存、表、全局变量等定义
)
```

> wat 使用 `;;` 注释

### 2. 函数 Functions

#### 2.1 函数签名

```wasm
(func $name (param $a i32) (param $b f64) (result f64) ...)
```

- $name：函数名（可选，调试用）
- param：参数类型（如 i32, f64）
- result：返回值类型

wasm v1.0 规定函数只能有一个返回值，wasm v2.0 函数可以返回多个值，例如

```wasm
(func $duplicate (param $x i32) (result i32 i32)
  local.get $x   ;; 第一个返回值
  local.get $x   ;; 第二个返回值
)
```

在 JavaScript 中 `WebAssembly.Instance` 只支持一个返回值，当有多个返回值时，会自动封装成**数组**。

```JavaScript
console.log(instance.exports.duplicate(5));     // [5, 5]
```

#### 2.2 局部变量

```wasm
(func (param i32)
  (local.get 0)           ;; 获取第 0 个参数
  (local $var i32)        ;; 声明局部变量
  (local $a f64 $b i64)   ;; 声明多个同类型变量
)
```

#### 2.3 函数体指令

指令按 ​​ 栈模型 ​​ 顺序执行

```wasm
(func $add (param $a i32) (param $b i32) (result i32)
  local.get $a    ;; 将 $a 压栈
  local.get $b    ;; 将 $b 压栈
  i32.add         ;; 弹出栈顶两个值，相加后压回结果
)
```

### 3. 类型 Types

类型可以是 inline 的，也可以显式定义复用：

```wasm
(type $AddSig (func (param i32 i32) (result i32)))
(func $add (type $AddSig)
  local.get 0
  local.get 1
  i32.add
)
```

### 4. 内存 Memory

#### 4.1 内存定义

wasm 只有四种数据类型 `i32` `i64` `f32` `f64` ，当需要处理其他的数据类型时，需要使用内存。内存可以在 JavaScript 中定义，也可以在 wasm 内部定义：

```wasm
;; 内部定义
(memory <min> <max>?)
```

内存可以具名，方便导出：

```wasm
(module
  ;; 定义内存：初始 5 页 (5 * 64KiB)，最大 10 页
  (memory $mem 5 10)

  ;; 导出内存，方便外部访问
  (export "memory" (memory $mem))
)
```

内存可以从宿主导入：

```wasm
;; 导入外部定义
;; 从 JavaScript 导入一个内存对象，模块名 "js"，内存名 "mem"
(import "js" "mem" (memory 5 10))
```

JavaScript 定义：

```JavaScript
const memory = new WebAssembly.Memory({
  initial: 5,  // 5 页
  maximum: 10  // 最大 10 页
});

const response = await WebAssembly.instantiateStreaming(..., {
  js: { mem: memory }
});
```

宿主导入的内存初始页数和最大页数要覆盖 wat 导入定义的初始页数和最大页数，也就是说，**wat 导入声明初始页数 ​​≤​​ 宿主初始页数**，**宿主最大页数 ≥​​ wat 导入声明最大页数**。否则模块初始化时，在验证阶段会报错。

#### 4.2 读内存

```wasm
;; 内存读取
[类型].load[位数][_符号]
```

符号后缀有两种， `_u` 表示无符号， `_s` 表示有符号。

常用的指令有：

- `i32.load` `i32.load8_s` `i32.load8_u` `i32.load16_s` `i32.load16_u`

- `i64.load` `i64.load8_s` `i64.load8_u` `i64.load16_s` `i64.load16_u` `i64.load32_s` `i64.load32_u`

- `f32.load`

- `f64.load`

加载指令看起来比较复杂，比如 `i32.load8_s` ，这条指令各部分的含义是：

- i32：结果类型是 32 位整数

- load：表示从内存中加载数据

- 8：表示加载的数据宽度是 8 位 (1 字节)

- \_s：表示是有符号扩展（sign-extend）

`从内存中读取 8 位 (0..255) -> 这 8 位数字是有符号整型 (-128..127) -> 扩展成 32 位整数 (i32) -> 返回`

例如：

```wasm
(func (param $ptr i32) (result i32)
  local.get $ptr ;; 内存地址偏移量
  i32.load8_s    ;; 返回 -128..127 的无符号字节
)
```

读内存指令除了指定地址参数外，还可以指定对齐方式和地址偏移量，默认这两个参数可以省略。如果需要指定对齐方式和偏移，指令变成：

```wasm
[类型].load[位数][_符号] align=N offset=M
```

这里 N 表示 2 的次幂，`align=3` 表示按 2³ = 8 字节对齐。

如果不指定对齐参数，那么将会使用`自然对齐`，即访问内存的数据长度。如 `i32.load8_u` 自然对齐为 8 位，一个字节，`align=0` 。

在很多 CPU 架构上，内存访问对齐可以提升性能（按数据类型的自然边界访问更快），指令带上对齐信息，能帮助编译器做优化。一般地，对齐参数和读取的位数量保持一致可以获得更好的性能，如 `i32.load` 自然对齐是 4 字节，即 `align=2` ，`i64.load` 自然对齐是 8 字节，`align=3` 。如果指定了一个不合适的对齐方式参数，代码不会跑飞，编译器在编译的时候会去拼凑数据，使得字节数是对齐的，性能会变差。

内存地址偏移量是一个无符号 32 位整型数，使用这个参数相当于扩展了 wasm 的寻址范围。在不使用偏移量时内存的寻址范围是 `2^32-1` 大约为 4GB ；使用偏移量之后，寻址范围扩展到 `2^32-1 + 2^32-1 = 2^33 - 2` 大约是 8GB 。有些情况下最大内存不超过 4GB （取决于宿主），如果尝试越界访问，会触发越界异常 trap 。

#### 4.3 写内存

```wasm
;; 内存写入
[类型].store[位数]
```

常用的指令有：

- `i32.store8` `i32.store16` `i32.store`（默认 32 位）

- `i64.store8` `i64.store16` `i64.store32` `i64.store` （默认 64 位）

- `f32.store`

- `f64.store`

例如：

```wasm
;; 把字节 72 ('H') 写入位置 0
i32.const 0     ;; address
i32.const 72    ;; value
i32.store8      ;; 在 address 写一个字节
```

利用更宽的指令可以一次性写入更多数据，要注意 wasm 采用小端存储：

```wasm
;; 写入字符 'h' 'e' 'l' 'l'
i32.const 0           ;; 内存地址
i32.const 0x6c6c6568  ;; memory bytes -> 68 65 6c 6c => 'h','e','l','l'
i32.store
```

写内存指令也可以提供**对齐参数**和**偏移量**，含义和读内存一致，这里就不赘述了。

#### 4.4 字符串直接写入

wasm 只支持 4 中数值数据类型，如何将字符串直接写入内存？字符串写入需要使用 `data` 指令，以 UTF-8 字节写入内存：

```wasm
;; 字符串写入默认内存
(data (i32.const <offset>) "bytes" ...)

;; 字符串写入具名内存
(data (memory $mem) (i32.const <offset>) "xxx\00")  ;; \00 表示终止符
```

举个例子，往内存中写入 “Hello World”：

```wasm
(data (i32.const 0) "hello world\00")
```

#### 4.5 其他内存控制指令

- `memory.size` 返回当前内存页数（i32，单位 page）

- `memory.grow` 内存增长，参数为需要增长的页数，执行成功返回增长前的页数（失败返回 -1）

- `memory.copy` 参数为 dest src len ，把`源地址+长度`的数据复制到`目标地址+长度`内存中，支持重叠

- `memory.fill` 参数为 dest value len ，把 len 个字节填充为 value

### 5. 表 Tables

表有两种类型，一种是函数引用 `funcref` ，另一种是宿主对象引用（外部引用） `externref` 。基本的语法为

```wasm
(table $tbl <min> <max>? <reftype>)
```

`min` 定义了表的最小尺寸，`max` 定义表最大扩展尺寸。表的尺寸限定函数/引用的数量。表是 wasm 和宿主之间隐藏代码位置，间接调用/访问的方法。假如 wasm 要向 JavaScript 提供自增和自减两个函数，但不希望宿主直接获取函数的索引：

```wasm
;; xxx.wat
(module
  ;; 定义一个函数类型：参数类型 i32，返回类型 i32
  (type $t (func (param i32) (result i32)))

  ;; 定义两个函数
  (func $inc (type $t) (param $x i32) (result i32)
    local.get $x
    i32.const 1
    i32.add
  )

  (func $dec (type $t) (param $x i32) (result i32)
    local.get $x
    i32.const 1
    i32.sub
  )

  ;; 定义一个表，初始大小 2，最大 5，用来存放函数引用
  (table $tbl 2 5 funcref)

  ;; 初始化表内容：索引 0 存 $inc，索引 1 存 $dec
  (elem (i32.const 0) $inc $dec)

  ;; 使用 call_indirect 调用表中的函数
  ;; 参数：表索引、函数参数
  (func (export "call_from_table") (param $idx i32) (param $x i32) (result i32)
    local.get $x      ;; push 参数
    local.get $idx    ;; push 函数索引
    call_indirect (type $t) (table $tbl)
  )
)
```

```JavaScript
const { instance } = await WebAssembly.instantiateStreaming(fetch("xxx.wasm"));

console.log(instance.exports.call_from_table(0, 10)); // 11 (自增)
console.log(instance.exports.call_from_table(1, 10)); // 9  (自减)
```

其他指令：

- `table.get <tableidx>` 从表里取出一个引用

- `table.set <tableidx>` 向表中写入一个引用

- `table.size <tableidx>` 取表当前大小

- `table.grow <tableidx>` 扩展表容量

- `table.fill <tableidx>` 批量填充某个引用

- `table.copy <dst> <src>` 从一张表拷贝到另一张表

### 6. 全局变量 Globals

全局变量可以定位为常量或变量：

```wasm
(global $counter (mut i32) (i32.const 0)) ;; 可变全局变量
(global $PI f64 (f64.const 3.14159))      ;; 常量
```

### 7. 导入和导出 Imports & Exports

#### 7.1 导入

```wasm
;; 导入函数
(import "env" "log" (func $log (param i32)))
;; 导入内存
(import "js" "mem" (memory 1))
```

#### 7.2 导出

```wasm
;; 导出函数
(export "add" (func $add))
;; 导出内存
(export "shared_mem" (memory $mem))
```

### 8. 控制流 Control Flow

wasm 的控制流指令有四类：块/循环、条件、跳转、控制。

#### 8.1 块/循环

`block` 和 `loop` 。`block` 创建具名的代码块，可以声明返回值，块结束时会把栈顶值作为块的返回值，配合 `br*` 可以实现跳转。

```wasm
(block $label (result <type>?) ... )
```

`loop` 是创建循环结构的入口，同样可以声明返回值，循环结束时会把栈顶值作为块的返回值，需要配合 `br*` 跳转到循环开头。如果循环块中没有 `br*` ，`loop` 并不会自动循环。

```wasm
(loop $label (result <type>?) ... )
```

例如：

```
;; 等效于 for (let i = 0; i < 5; i++) {}
(local $i i32)
(loop $start
  (local.set $i (i32.add (local.get $i) 1))
  (br_if $start (i32.lt_s (local.get $i) (i32.const 5)))  ;; 循环5次
)
```

#### 8.2 条件

`if` 用栈顶 i32 数值作为条件选择执行 `then` 或者 `else`，可以声明返回值，`then` 和 `else` 必须产生这个类型的返回。

```wasm
(if (result <type>?)
  (then ...)
  (else ...)
  (end)
)
```

例如编写一个输出参数绝对值加一的函数：

```wasm
(func (param $x i32) (result i32)
  local.get $x
  i32.const 0
  i32.lt_s        ;; x < 0 ?
  if (result i32)
    ;; then: x 是负数 -> return -x + 1
    local.get $x
    i32.const -1
    i32.mul       ;; 取反 x = x * -1
    i32.const 1
    i32.add
  else
    ;; else: x >= 0 -> x + 1
    local.get $x
    i32.const 1
    i32.add
  end
)

```

#### 8.3 跳转

跳转指令有 3 个：无条件跳转 `br` ，条件跳转 `br_if` ，多路分支跳转 `br_table` 。

```wasm
;; 无条件跳转
br <label>
;; 消耗栈顶(i32)，若非零则跳转
br_if <label>
;; 栈顶(i32)作为索引，如果栈顶是 `[0, n]` 则跳转到对应的 `label` ，否则跳转到 `default`
br_table <label_0> <label_1> ... <label_n> <default_label>
```

`<label>` 可以是块的名称，也可以使 `i32` 数字，使用数字时，表示跳出的层级，`0` 表示跳出当前层级，`1` 表示跳出父层级，以此类推。建议使用块名称。所谓跳转，并非跳转到定义块的首行，而是跳转到定义块的结尾。

举几个例子：

```wasm
;; br
(block $outer
  (block $inner
    (br $outer)  ;; 直接跳出到 $outer
  )
  (unreachable)   ;; 此处往后，块内指令不会执行
)
```

```wasm
;; br_if
(func (param $p i32) (result i32)
  (block $outer (result i32)
    (block $inner
      local.get $p
      i32.const 0
      i32.eq
      ;; 如果输入 p === 0 则跳到 $outer，带上 999 作为 $outer 的返回值
      i32.const 999
      br_if $outer
    )
    ;; 没有跳转则到这里，$outer 返回 123
    i32.const 123
  )
)
```

```wasm
;; br_table
(func (param $i i32) (result i32)
  (block $end (result i32)
    (block $default
      (block $case2
        (block $case1
          (block $case0
            local.get $i
            ;; 参数顺序： <labels...> <default>
            ;; idx === 0 -> branch to $case0
            br_table $case0 $case1 $case2 $default
          ) ;; end $case0
          ;; 当分支到 $case0 时会执行下面这句
          i32.const 10
          br $end
        ) ;; end $case1
        ;; 当分支到 $case1 时会执行下面这句
        i32.const 20
        br $end
      ) ;; end $case2
      ;; 当分支到 $case2 时会执行下面这句
      i32.const 30
      br $end
    ) ;; end $default
    ;; 当 br_table 命中 default（index 超范围）时，会跳到 $default 的结束处，
    ;; 然后继续执行这里的代码 —— 返回默认值 99
    i32.const 99
  ) ;; end $end
)
```

如果块定义了返回值，记得在跳转之前先把返回值压栈。要注意返回值和判断值的压栈顺序是，**先压返回值，再压判断条件**，不压返回值或压栈顺序不对，类型检查会失败。

#### 8.4 函数控制

函数控制指令有两类，一类是调用函数 `call` 和 `call_indirect` ，另一类是终止函数 `return` 。

`call` 是直接调用， `call_indirect` 是使用表索引间接调用。

```wasm
call $funcname
call_indirect (type $t) (table $tbl?)
```

直接调用很简单，这里不举例了， `call_indirect` 比较复杂，在 [5. 表 Tables](#_5-表-tables) 这一章节中有示例，可以倒回去阅读代码，这里解释参数：

- `type $t` 表示当前调用的函数签名

- `table $tbl?` 当前调用的表索引，可以不指定，默认使用 表 0

调用函数在表中的索引和函数参数从栈获取，栈顶是索引，然后是参数。所以**压栈的顺序是先压参数后压索引**。

`return` 是直接跳出函数，并返回值。返回值从栈顶取，所以在执行之前先压栈。

#### 8.5 其他

还有一些不太好分类的流控制指令：

- `unreachable` 立即触发 trap ，即运行时异常。用于标记不应触及的路径或产生错误

- `nop` 空操作，不做任何事，对行为无影响，占用一个机器指令执行周期

### 9. 数据段初始化内存

详见 [4.4 字符串直接写入](#_4-4-字符串直接写入)。

### 10. 表初始化

详见 [5. 表 Tables](#_5-表-tables)。
