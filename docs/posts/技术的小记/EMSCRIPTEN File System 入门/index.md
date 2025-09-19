---
createDate: 2025/08/26
tags: WebAssembly, EMSCRIPTEN, FileSystem
---

# EMSCRIPTEN File System 入门

[[createDate]]

[[toc]]

这篇我们跳出 GDAL 的范围，讨论一下 emscripten 的特性。

## 文件系统

在计算机中，文件系统 File System 一种以**文件**方式管理和访问数据的方式。数据存储在形形色色不同的硬件设备中，每种不同的设备访问数据的方式都不一样，文件系统将这些晦涩难懂的数据管理和访问抽象成统一的接口，用户就可以在不了解物理设备参数的情况下，通过一个个简单的文件管理和访问存储在上面的数据。不同的操作系统各自在不同时期发展出不同的文件系统，比如 Linux 支持 ext 、ext2 等，Windows 支持 NTFS 、FAT32 等，Mac OS 支持 HFS+ 、APFS 等，它们之间并不完全兼容。

为了能在不同的类 UNIX 操作系统之间运行软件， IEEE 制订了 POSIX 标准，Linux 基本上遵循了 POSIX 规范，包括文件系统。Linux 通过 ​​VFS（Virtual File System）​​ 层实现了抽象，VFS 是内核中的一个软件层，它为所有不同类型的文件系统提供了一个通用的接口。应用程序和系统调用只与 VFS 交互，由 VFS 将操作路由到具体的文件系统驱动（如 ext4, ntfs）。

> 为什么要介绍 Linux 和 POSIX ？原因有 2 ：
>
> 1. 绝大多数算法库都在兼容 POSIX 的文件系统的操作系统中编译
> 2. emscripten 的文件系统受到了 Linux 兼容 POSIX 的启发

## 应用程序对文件系统的访问

操作系统为应用程序提供文件访问的库函数，在 C/C++ 中，这个库是 libc/libc++ 。库函数进一步封装了文件系统的操作细节，操作文件变成了操作文件句柄，这样做的好处有：

1. 减少系统内核调用
2. 方便兼容不同的操作系统
3. 简化操作

![文件读取架构](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fc3mkaqn33ng2g7kzxqf.png)

假设要在 C 程序中读取一个文件，流程是 `打开文件 -> 读取数据 -> 关闭文件` ：

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    const char *path = "input.txt";
    FILE *fp = fopen(path, "r");          // 打开文本文件（只读）
    if (!fp) {
        perror("fopen failed");
        return 1;
    }

    char buffer[1024];                    // 用于存储每一行数据
    while (fgets(buffer, sizeof(buffer), fp)) {
        // 此处数据已经存放在 buffer 中，可在需要时使用
        // 例如：处理字符串、解析内容等
    }

    if (ferror(fp)) {                     // 检查读取过程中是否出错
        perror("read error");
        fclose(fp);
        return 1;
    }

    fclose(fp);                           // 关闭文件
    return 0;
}
```

> libc 是 C standard library ，即 C 标准库。截至目前，它包含了 30 个头文件，其中 `<stdio.h>` 包含核心的输入输出函数，`<stdlib.h>` 包含数值转换、内存分配、过程控制等函数。常用的还有数学计算函数 `<math.h>` ，断言 `<assert.h>` 等。

## wasm 如何读写文件

在 JavaScript 中，一般使用 `File` 对象存储文件，`File` 继承自 `Blob` ，本质上大块的二进制数据。如果我们自己设计算法，一般会将文件写入 Memory 中，在调用函数的时候把 `ArrayBuffer` 作为指针传递。成熟的库文件读写基于文件系统开发，使用文件路径寻找文件，使用文件句柄传递文件，很难改成指针。

为此 emscripten 开发了一套接口用于兼容标准文件读写。由于是受 POSIX 启发，所以这套接口和 Linux 的读写接口非常相似。对于应用程序来说，文件系统是透明的，它只知道通过 libc 接口就可以读写文件，不知道数据在硬件设备上具体的存储机制，emscripten 在编译时使出一技偷梁换柱，把 libc 接口替换成 syscalls ，把原本操作系统的 VFS 调用替换成 emscripten VFS 调用，实现 wasm 文件读写。

![转换流程](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zhof30ykao069mno071v.png)

## emscripten 文件系统

文件读写接口有了，文件给如何存储呢？ emscripten 提供了一套灵活的虚拟文件系统架构：

![Emscripten file system architecture](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wx5km56td0iy16mu3uua.png)

### MEMFS

内存文件系统是 emscripten 默认的文件系统，初始化时自动挂载在根目录 `/` ，数据保存在内存中，页面刷新会丢失数据。

### NODEFS / NODERAWFS

> 这两种文件系统只能在 Node.js 环境中使用

NODEFS 文件系统将宿主的文件系统代理到 emscripten 虚拟文件系统中，使用 Node.js 同步文件 api ，可以间接读写本地磁盘的数据。

NODERAWFS 文件系统不需要通过 emscripten 代理，直接调用 Node.js 文件模块。最显著的区别是，NODEFS 需要执行 `FS.mount()` 挂载虚拟文件系统，通过虚拟路径读写文件；NODERAWFS 不需要挂载，直接使用绝对物理路径读写。

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ipjck3yn7cys1626muhb.png)

NODERAWFS 比 NODEFS 快，NODEFS 有文件缓存可以减少系统调用。当需要从磁盘读写大文件时，选 NODERAWFS ；当处理零碎小文件时，选 NODEFS 。

### IDBFS

> IDBFS 只能在浏览器中使用，包括 WebWorker

IDBFS 将数据存储在 `IndexedDB` 实例中。**IndexedDB 提供异步接口，POSIX 标准是同步接口**，两者无法兼容。使用 IDBFS 时，emscripten 先将数据存储在 MEMFS 中，并记录文件是否有修改，最后需要用户调用 `FS.syncfs()` 函数一次性把变更写入 IndexedDB 中。如果用户忘记执行 `FS.syncfs()` 便关闭页面或刷新页面，MEMFS 记录的文件将会丢失，可以通过监听 `pagehide` 或 `beforeunload` 事件强制刷盘。

在挂载 IDBFS 的时候可以设置 `autoPersist: true` 参数，这样每次有文件发生变化的时候都会保存。如果改动文件比较频繁，可能会造成性能浪费。

### WORKERFS

> WORKERFS 仅能在 Worker 中使用

该文件系统提供对 Worker 内部的 `File` 和 `Blob` 对象的只读访问，而无需将整个文件数据复制到内存中，可用于处理大文件。

### PROXYFS

PROXYFS 用于多个 wasm 模块之间文件共享。

```JavaScript
// Module 2 can use the path "/fs1" to access and modify Module 1's filesystem
module2.FS.mkdir("/fs1");
module2.FS.mount(module2.PROXYFS, {
    root: "/",
    fs: module1.FS
}, "/fs1");
```

## 虚拟文件系统解析

emscripten 文件系统的核心数据是 FSNode ，模拟了 Linux 文件系统中的 inode 数据结构。基本数据结构为：

```JavaScript
class {
  node_ops = {};   // 节点操作（如 lookup , create 等）
  stream_ops = {}; // 流操作（如 read , write , seek 等）
  mounted = null;  // 节点的挂载信息

  constructor(parent, name, mode, rde) {
    if (!parent) {
      parent = this;  // root node sets parent to itself
    }

    this.parent = parent; // 父节点（目录节点）
    this.name = name;     // 节点名称（文件名或目录名）
    this.mode = mode;     // 文件类型和权限
    this.rdev = rdev;     // 设备文件的主/次设备号（非设备文件为 0）

    this.id = FS.nextInode++; // 全局唯一的 node 编号
    this.contents = null;     // 文件内容（ ArrayBuffer ）或目录项列表
    this.size = 0;            // 文件大小（字节数）

    this.mount = parent.mount; // 指向挂载到此节点的文件系统

    this.atime = this.mtime = this.ctime = Date.now(); // atime（访问时间）、 mtime（修改时间）和 ctime（状态改变时间）
  }
}
```

初始化文件系统时，执行 `FS.mount(MEMFS, {}, '/')` ，将内存文件系统挂载到根目录下，其他文件系统可以按需挂载到内存文件系统中，如

```JavaScript
FS.mount(WORKERFS, {
  files: files // Array of File objects or FileList
}, '/worker'); // 挂载 WORKERFS 到 /worker 目录
```

其他文件操作，如 `mkdir` `rmdir` `chmod` `link` 等函数均在 `FS` 对象中实现，直接调用即可。文件系统具有继承性，除非是挂载点，子节点的文件系统类型继承自父节点:

`mkdir() -> mknod() -> lookupPath() -> new FSNode()`

应用程序调用 `open` `read` `write` `close` 最终会被指向 `FS.open` `FS.read` `FS.write` `FS.close` 。

`mode` 记录文件类型和权限，使用 POSIX 规范，使用 32 位证书表示，前 8 位表示文件类型，后 24 位表示权限。

## 硬件设备

**万物皆文件**，和其他类 Unix 操作系统一样，emscripten 虚拟文件系统可以注册硬件设备。举一个简单的例子，假设我们想在浏览器中模拟串行通信设备：

```JavaScript
// 生成设备号
const dev = FS.makedev(1, 8);

// 注册设备操作
FS.registerDevice(dev, {
  read(stream, buffer, offset, length) {
    // TODO ...
  },
  write(stream, buffer, offset, length) {
    // TODO ...
  },
  ioctl() {
    // TODO 模拟获取波特率
  }
});

// 创建设备节点
FS.mkdir('/dev/ttyUSB0');
FS.mkdev('/dev/ttyUSB0', dev);
```

接下来便可以在 C 中对 `/dev/ttyUSB0` 串行口进行读写了。

## 发展

目前 emscripten 虚拟文件系统均基于 JavaScript 开发，有一个显著的缺点就是无法支持多线程。emscripten 正在开发新的文件系统 WASMFS ，目前还未完成，未来 WASMFS 会支持多线程，性能会有比较大的提高。
