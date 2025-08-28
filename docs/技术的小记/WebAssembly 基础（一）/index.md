---
createDate: 2024/06/21
---

# WebAssembly 基础（一）

[[createDate]]

> 本系列是读书笔记，比较零散

[[toc]]

## 高级计算机语言的两种运行方式

1. 预先编译 Ahead-of-Time Compilation ，简称 AOT
2. 即时编译 Just-in-Time Compilation ，简称 JIT

像 C/C++ 这类属于预先编译的计算机语言，而 JavaScript 这种属于即时编译语言。

## 现代编译器结构

编译器的最终目的是将高级计算机语言编译成机器语言，由于用户使用的 CPU 五花八门，相同的高级语言代码编译出来的可执行文件都有可能是不同的。为了提高效率，编译器会按照编译流程模块化设计。一般由 **前端(Front End)** 、**中端(Middle End)** 和 **后端(Back End)** 组成，每个节点都会产生中间表示(IR)传递给下一级。前端和中端的处理与硬件无关，最终在后端生成符合硬件参数的汇编代码。这种设计的好处在于，同一个编译器在不同的平台只需要开发不同的后端即可：

![编译器结构](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xlaxeetcoumt3u9q4ozj.png)

举个例子，C 的编译过程：

![C 语言编译](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jbu6gh39qw1d2c4pn6jr.png)

### WebAssembly 的编译流转过程

![WebAssembly 的编译流转过程](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ngg9d01lyehgosmy6qhw.png)

WASM 是编译器的目标代码，但从浏览器的角度来看，WASM 更像是中端产出的 IR 。最终要被 AOT/JIT 编译器编译成平台相关的机器码。

## 格式

1. 二进制格式，文件后缀是 .wasm
2. 文本格式，文件后缀是 .wat
3. 内存格式

二进制格式是 wasm 模块的主要格式，文本格式是为了方便开发者调试和理解 wasm 。但其实 wat 的阅读性也很差，如同读汇编。

![3种格式](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mr1oiwhrpxablv76ef9a.png)

wasm 模块必须安全可靠，所以在进入实例化之前，浏览器会先解码 wasm 为内存格式(in-memory) ，使用内存格式进行验证。

![语义阶段](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xpwujfp0tiudyyhmhvqe.png)

## wasm 结构

![wasm 结构](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uxdarln3ak447aivnv2k.png)

流式(Streamable)加载 + 严格的段顺序，保证 wasm 可以一遍(One-Pass)完成代码的加载、解析、验证和编译。
