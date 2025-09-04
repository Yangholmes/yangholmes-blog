---
createDate: 2025/09/04
---

# wabt 使用小记

[[createDate]]

[[toc]]

[wabt](https://github.com/WebAssembly/wabt) 是 WebAssembly 二进制格式工具集，提供 wasm 相关的代码编译、分析、调试和验证等功能。这篇简单介绍一下常用命令的用法。

## 编译 wat 代码

用 wat 实现斐波那契数列：

```wat
;; fib.wat
(module
  (import "env" "log" (func $log (param i32)))

  ;; 申请一页内存
  (memory (export "memory") 1)

  ;; 全局变量：堆指针（指向下一个可用内存地址）
  (global $heap_ptr (mut i32) (i32.const 0))

  ;; 分配内存块
  ;; params：size (i32) - 需要分配的字节数
  ;; return：起始地址 (i32)
  (func $allocate (param $size i32) (result i32)
    (local $start i32)
    (local.set $start (global.get $heap_ptr))
    (global.set $heap_ptr
      (i32.add
        (global.get $heap_ptr)
        (local.get $size)
      )
    )
    (local.get $start)
  )

  ;; 斐波那契数列
  ;; params：n (i32) - 数组长度
  ;; return：数组起始地址 (i32)
  (func (export "fib") (param $n i32) (result i32)
    (local $i i32)
    (local $arr_ptr i32)
    (local $prev i32)
    (local $curr i32)
    (local $next i32)

    ;; 分配内存：n * sizeof(i32) = n * 4
    (local.set $arr_ptr
      (call $allocate
        (i32.mul
          (local.get $n)
          (i32.const 4)
        )
      )
    )

    ;; 边界情况处理
    (if (i32.le_s (local.get $n) (i32.const 0))
      (then (return (local.get $arr_ptr)))  ;; 返回空数组地址
    )

    ;; 初始化前两个元素
    (i32.store (local.get $arr_ptr) (i32.const 0))
    (if (i32.gt_s (local.get $n) (i32.const 1))
      (then
        (i32.store
          (i32.add (local.get $arr_ptr) (i32.const 4))
          (i32.const 1)
        )
      )
    )

    ;; 迭代计算后续元素
    (local.set $prev (i32.const 0))
    (local.set $curr (i32.const 1))
    (local.set $i (i32.const 2))
    (loop $loop
      ;; 计算下一个斐波那契数
      (local.set $next (i32.add (local.get $prev) (local.get $curr)))
      (local.set $prev (local.get $curr))
      (local.set $curr (local.get $next))

      ;; 存储到内存
      (i32.store
        (i32.add
          (local.get $arr_ptr)
          (i32.mul (local.get $i) (i32.const 4))
        )
        (local.get $next)
      )

      ;; 循环控制
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br_if $loop (i32.lt_s (local.get $i) (local.get $n)))
    )

    ;; 返回数组起始地址
    (local.get $arr_ptr)
  )
)
```

使用 wabt 编译代码：

```bash
wat2wasm ./fib.wat -o ./fib.wasm
```

得到 wasm 文件：

```bash
├── fib.wasm
├── fib.wat
└── main.ts
```

main.ts 提供了宿主调用 wasm 代码：

```TypeScript
import fibUrl from './fib.wasm?url';

WebAssembly.instantiateStreaming(fetch(fibUrl), {
  env: {
    log: (value: string | number) => console.log(value)
  }
}).then(res => {
  // 解构导出对象，获得 fib 函数 和 内存
  const { fib, memory } = res.instance.exports as unknown as {
    fib: (n: number) => number;
    memory: WebAssembly.Memory
  };
  // 斐波那契数列长度
  const n = 10;
  // 计算，结果保存在内存中，获得保存结果的指针
  const addr = fib(n);
  // 读取结果
  const buffer = new Uint32Array(memory.buffer, addr, n);
  const result = Array.from(buffer);
  console.log(result);
})
```

使用 vite 作为构建工具，vite 支持将任何类型资源作为 url 导入，这里将 wasm 转化成资源地址，使用 `WebAssembly.instantiateStreaming` 和 `fetch` 加载。实际上 vite 也支持使用 `?init` 后缀加载并自动初始化 wasm 文件，详细可以查阅 vite 文档。

这里尝试使用 `fib` 函数去计算长度为 10 的斐波那契数列，输出结果为：

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ouxn7vsvxz4nvjq7pexx.png)

符合预期。

看一下 wat 代码和 wasm 文件的大小对比：

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yqygcvuhh6mcb7xeli6d.png)

可以看出，经过编译后，wasm 文件比源码小了一个数量级。如此高效除了 wasm 格式紧凑以外， LEB128 压缩也贡献不少。

## 分析 wasm

`wasm-objdump` 命令跟操作系统 `objdump` 类似，用来分析 wasm 文件信息。有什么用？这里举一个例子：开发者拿到一个 wasm 模块，想要快速知道导出函数都有哪些，每个函数的入参数量和类型，返回值长度和类型，就可以使用 `wasm-objdump` 工具分析。以上一节 fib.wasm 文件为例：

```bash
 wasm-objdump ./fib.wasm -j Export -x
```

输出信息

```bash
fib.wasm:       file format wasm 0x1

Section Details:

Export[2]:
 - memory[0] -> "memory"
 - func[2] <fib> -> "fib"
```

说明 fib.wasm 有两个导出项，一个是内存，另一个是 `fib` 函数，函数类型是 2 ，接下来再导出函数签名

```bash
wasm-objdump ./fib.wasm -j Function -x
```

得到：

```bash
fib.wasm:       file format wasm 0x1

Section Details:

Function[2]:
 - func[1] sig=1
 - func[2] sig=1 <fib>
```

函数 2 的类型在 `Type` 段声明，且使用索引为 1 的类型，导出 `Type` 段：

```bash
wasm-objdump ./fib.wasm -j Type -x
```

`Type` 信息为：

```bash
fib.wasm:       file format wasm 0x1

Section Details:

Type[2]:
 - type[0] (i32) -> nil
 - type[1] (i32) -> i32
```

最终获取到了 fib.wasm 导出内容的全部信息：

1. 导出内存
2. 导出函数 `fib` ，`fib` 有一个 `i32` 类型的入参，有一个 `i32` 类型的返回值

`wasm-objdump -x` 参数可以单独直接使用，会输出 wasm 文件所有块信息，信息量小的文件可以直接全部输出，信息量大的文件建议分块输出，方便分析。

## 整理代码

`wat-desugar` 命令可以用来整理现有的 wat 代码，以符合某些规范。比如上文的 fib.wat 源码没有严格按照 `操作数压栈 -> 执行指令` 的流程编写，经常将操作数写在指令后面，尽管是合法的写法，但不符合栈式虚拟机的范式。使用 `wat-desugar` 可以帮助我们规范这份代码。这里展示 `$allocate` 函数整理后的代码：

```wat
(func $allocate (param $size i32) (result i32)
    (local $start i32)
    global.get $heap_ptr
    local.set $start
    global.get $heap_ptr
    local.get $size
    i32.add
    global.set $heap_ptr
    local.get $start
)
```

结合上文源码可以看出来整理后的代码紧凑，更加符合栈式调用的范式，但是更不易读了。最明显的区别就是加法运算 `i32.add` ，源码将操作数放在了指令的后面，而规范写法应该是先压栈再调用加法指令。

## 反汇编

wabt 工具有 3 个反汇编命令：

- `wasm2wat` 将 wasm 反汇编成 wat 代码
- `wasm2c` 将 wasm 反汇编成 C 源码和头文件
- `wasm-decompile` 将 wasm 反汇编成容易阅读的 C 风格伪代码

笔者在开发过程中 `wasm-decompile` 配合 `wasm2wat` 使用比较多。 `wasm-decompile` 用来分析功能的实现，如果需要对模块小修小改，使用 `wasm2wat` 获得 wat 文件，修改后再用编译命令将 wat 编译成新的 wasm 即可。
