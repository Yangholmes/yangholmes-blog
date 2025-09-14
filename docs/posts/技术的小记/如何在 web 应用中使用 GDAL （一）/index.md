---
createDate: 2025/08/04
title: 如何在 web 应用中使用 GDAL （一）
tags: WebAssembly, GDAL, EMSCRIPTEN
---

# 如何在 web 应用中使用 GDAL （一）

[[createDate]]

[[toc]]

> 开胃菜

## 前言

有过 GIS 相关开发工作的朋友都知道，GDAL 是 GIS 图形处理最强大的工具，对于 native 客户端和服务端的开发者来说非常友好，提供了适用于多种 CPU 和操作系统的可执行文件和 lib 文件，只要开发者使用的不是小众平台，都能轻松方便地获取。但对于 GDAL 来讲， Web 就是一个小众平台，并没有提供这个平台的任何支持。所以一般地， WebGIS 软件都会将 GDAL 相关服务部署到服务端，客户端通过 HTTP 请求的方式调用。这个方案有一些不足：

1. 通过网络请求调用增加了应用的响应时间，无法实现实时应用

2. 浪费客户端的算力，增加了服务端成本

所以 WebGIS 用到 GDAL 相关的功能时，总是给用户缓慢、卡顿的感觉。

使用 emscripten + WebAssembly 让 GDAL 应用与 web 应用成为可能：GDAL 是一个 C/C++ 项目，emscripten 是一个用于 WebAssembly 的 C/C++ 编译工具，或许能够使用 emscripten 将 GDAL 编译成 JavaScript 可以调用的形式，从而将这个工具移植到 WebGIS 应用中。

![移植路径](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pigs5v4hldjieax8dlbo.png)

## 使用 emscripten

对于习惯于编写 JavaScript 的前端开发者来说，如何开始使用 emscripten 就是一个不小的问题。和大多数开源项目一样，emscripten 也是从源码编译开始。这里不大篇幅赘述安装过程，详细请查看 [emsdk 文档](https://emscripten.org/docs/getting_started/downloads.html#installation-instructions-using-the-emsdk-recommended)。如果安装总是不成功，或者懒得安装，也可以使用 emsdk 的 [Docker 镜像](https://hub.docker.com/r/emscripten/emsdk)。

安装好并验证成功之后，就可以开始尝试使用 emscripten 进行编译了。这里举一个简单的例子：

```c
// hello_world.c
#include <stdio.h>

int main() {
  printf("hello, world!\n");
  return 0;
}
```

使用 `emcc` 命令编译这份代码：

```bash
./emcc hello_world.c
```

稍等片刻就会获得两个文件：

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t43q1f8xkl8wh97ssady.png)

`a.out.wasm` 便是 WebAssembly 文件，包含了编译结果，`a.out.js` 是提供给 JavaScript 加载和调用 WebAssembly 代码的胶水代码文件。使用 `node.js` 执行：

```bash
node a.out.js
```

控制台中会打出 “hello, world!”。

仔细观察就会发现，其实 emsdk 的使用和 gcc 差不多，编译 C 文件时，**使用 `emcc` 代替 `gcc` 便可**，编译 C++ 时，使用 `em++` 命令。同时，和 cmake 类似，emsdk 也提供了 `emmake`、 `emconfigure` 等编译指令。除了专门的配置参数以外，其余参数都是通用的。这种设计大大降低了使用难度。

## 编译 GDAL

GDAL 当前版本（3.9）使用 CMake 编译，最小依赖如下：

- CMake >= 3.16
- C99 compiler
- C++17 compiler
- PROJ >= 6.3.1

按照编译文档，我们将命令 `cmake ..` 替换成 `emcmake cmake ..` ，执行后就会发现，编译直接报错，并不像按照上一节讲的那么简单，把编译指令换一下就能编译成功。这是什么原因呢？问题出在 GDAL 编译的依赖上。将一个项目编译成 WebAssembly ，除了需要编译当前项目以外，还**需确保其依赖库（如 GDAL 依赖库 PROJ、GEOS 等）均通过 emscripten 编译**，而不能使用本地已经安装好的版本，或者使用 CMake 编译的版本。使用 emscripten 编译的 lib 文件并不会存放在系统默认位置，在 CMake 指令中，如果依赖没有安装在默认位置，可以使用 `-D<lib>_INCLUDE_DIR=<value>` 和 `-D<lib>_LIBRARY=<value>` 指定，所以正确的编译姿势应该是：

```bash
./emcmake cmake ..
  -DSQLite3_INCLUDE_DIR=$(EM_OUT_DIR)/include -DSQLite3_LIBRARY=$(EM_OUT_DIR)/lib/libsqlite3.a \
  -DPROJ_INCLUDE_DIR=$(EM_OUT_DIR)/include -DPROJ_LIBRARY_RELEASE=$(EM_OUT_DIR)/lib/libproj.a \
  -DTIFF_INCLUDE_DIR=$(EM_OUT_DIR)/include -DTIFF_LIBRARY_RELEASE=$(EM_OUT_DIR)/lib/libtiff.a \
  -DGEOTIFF_INCLUDE_DIR=$(EM_OUT_DIR)/include -DGEOTIFF_LIBRARY_RELEASE=$(EM_OUT_DIR)/lib/libgeotiff.a \
  -DZLIB_INCLUDE_DIR=$(EM_OUT_DIR)/include -DZLIB_LIBRARY_RELEASE=$(EM_OUT_DIR)/lib/libz.a \
  -DSPATIALITE_INCLUDE_DIR=$(EM_OUT_DIR)/include -DSPATIALITE_LIBRARY=$(EM_OUT_DIR)/lib/libspatialite.a \
  -DGEOS_INCLUDE_DIR=$(EM_OUT_DIR)/include -DGEOS_LIBRARY=$(EM_OUT_DIR)/lib/libgeos.a \
  -DWEBP_INCLUDE_DIR=$(EM_OUT_DIR)/include -DWEBP_LIBRARY=$(EM_OUT_DIR)/lib/libwebp.a \
  -DEXPAT_INCLUDE_DIR=$(EM_OUT_DIR)/include -DEXPAT_LIBRARY=$(EM_OUT_DIR)/lib/libexpat.a \
  -DIconv_INCLUDE_DIR=$(EM_OUT_DIR)/include -DIconv_LIBRARY=$(EM_OUT_DIR)/lib/libiconv.a;
```

在此之前，还需要先用 emscripten 把所有依赖库 `include` 文件和 `.a` 文件编译出来。看起来并没有想象中那么简单，对吗？

github 上有一个 gdal3.js 的项目提供了完整的[编译脚本](https://github.com/bugra9/gdal3.js/blob/master/Makefile)，使用了类似栈的堆叠方式，按照依赖的顺序下载并编译了所有源码，我们看 GDAL 和 PROJ 的编译指令（81 行和 201 行），这两个库都有大量的依赖，都使用了 `-D<arg>=<value>` 参数指定依赖路径。

在这个 Makefile 目录下执行 make ，不出意外的话，一大段时间之后就可以成功结束编译，获得三个文件：

![gdal 编译结果](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/51e1q6wwgnou6gxhaqrm.png)

## 结语

本篇介绍了 emscripten 的基本使用和 GDAL 的编译，初步获得了 WebAssembly 文件和胶水代码。**但这只是一个起点**，真正的问题没有解决：

1. 如何使用 WebAssembly 文件
2. 编译结果太大，三个编译成果加起来有 ~38MB ，如何优化编译
3. 如何工程化

将会在后面的几篇文章中娓娓道来。
