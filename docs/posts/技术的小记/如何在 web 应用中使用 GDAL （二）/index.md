---
createDate: 2025/08/10
title: 如何在 web 应用中使用 GDAL （二）
tags: WebAssembly, GDAL, EMSCRIPTEN
---

# 如何在 web 应用中使用 GDAL （二）

[[createDate]]

[[toc]]

[上一篇](../如何在%20web%20应用中使用%20GDAL%20（一）/)已经把编译搞定了，这一篇来看看怎么用。

## WebAssembly 基本用法

### 实例化 wasm

WebAssembly 名字带 assembly ，确实很像汇编语言，它位于中间表达和机器码之间。跟使用其他 JavaScript 库不同， WebAssembly 并不能像 esmodule 那样通过 `import` 指令将代码加载到线程中，也不能使用 `<script>` 加载，因为它并不是 JavaScript 。

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/u219u1w1fg7m4c9ypucf.png)
配图来自 [Creating and working with WebAssembly modules](https://hacks.mozilla.org/2017/02/creating-and-working-with-webassembly-modules/)，非常好的文章，使我大脑旋转

浏览器提供了一套完整的 WebAssembly 接口用于加载代码，也不复杂，假设我们有一个 some.wasm 的文件，加载只需要如下几行代码：

```JavaScript
fetch("some.wasm")
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes, options))
  .then(({instance}) => {
    // 假设导出了一个 some_func 函数
    instance.exports.some_func();
  });
```

所有的导出都会挂载在 `instance.exports` 上，通过查阅源码或者 wasm 作者提供的文档，我们就可以知道可以调用的接口有哪些，也可以知道接口参数是什么。

### 内存管理

JavaScript 开发者向来不太关心内存，仿佛有一个专门的管家在管理着内存。和 JavaScript 不同的是，WebAssembly 需要手动管理内存，才能正常地读写。WebAssembly 的内存是连续无类型的线性内存，犹如一个数组，有专门的指令进行读写，这与 C/C++ 指针如出一辙。内存在 JavaScript 中申请，加载的时候传入 wasm 的实例中：

```javascript
const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

fetch("some.wasm")
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes, {
    { memory: memory }
  }));
```

WebAssembly 和调用它的代码运行在同一个线程，和使用 transfer 的 worker 不同，WebAssembly 和 JavaScript 可以访问同一块内存。我们可以利用这一点，通过读写同一块内存进行数据传输。另外要注意的是，WebAssembly 只能访问由 JavaScript 申请并在实例化时传入的内存，访问不了其他位置的内存。

但 WebAssembly 实例化提供初始 memory 并**不是必须的**， wasm 也可以自己申请内存。使用 JavaScript 提供内存的好处在于数据共享和复制，在图形、音视频处理等场景下需要大量传输数据，如果通过函数参数传输，数据需要先经过序列化/反序列换操作，再深拷贝，效率远不及传输一个内存地址。此外，JavaScript 创建的内存可以提供给多个 wasm 模块使用，利用这个特性可以实现 wasm 不同模块间的协作。

### 表机制

除了向外暴露的接口以外，WebAssembly 还可能需要调用 JavaScript 的功能，比如果将 `console.log` 函数映射到 C 中作为标准输出，可以这么操作：

```javascript
WebAssembly.instantiate(wasmBlob, {
  env: {
    js_callback: (value) => console.log(value), // 直接注入JS函数
  },
});
```

在 C 中运行这个 `js_callback` 便可以在控制台输出信息。但是这个方式有很大的风险，

1. 可以基于 `js_callback` 篡改函数指针，泄露浏览器内部指针地址，随意执行未知代码
2. 一旦绑定函数，就无法更改
3. wasm 中并不知道函数是否被回收，如果某个绑定的函数已经被垃圾回收，wasm 调用将产生崩溃

WebAssembly 使用 **表** 来保证代码运行安全。将函数地址改为函数引用，不能直接读写指针，保障了浏览器安全。这里展示一个例子：

```c
// C

// 定义与 console.log 匹配的函数签名
typedef void (*log_func_ptr)(const char* message);

void safe_log(const char* message) {
    // 获取全局日志函数索引（在JS中设置）
    extern uint32_t log_function_index;

    // 指针声明
    log_func_ptr log_ptr;

    // 调用
    log_ptr(message);
}
```

```javascript
// JavaScript

function sanitizedConsoleLog(messagePtr) {
  // 边界检查 - 读取C字符串的长度限制
  const maxLen = 256;
  let length = 0;

  // 安全读取字符串
  while (length < maxLen) {
    const byte = wasmMemory.getUint8(messagePtr + length);
    if (byte === 0) break;
    length++;
  }

  // 提取安全范围内的字符串
  const messageBytes = new Uint8Array(
    wasmMemory.buffer,
    messagePtr,
    Math.min(length, maxLen)
  );

  // 转换为字符串
  const message = new TextDecoder("utf-8", { fatal: true }).decode(
    messageBytes
  );

  // 真正的调用
  console.log(message);
}

const table = new WebAssembly.Table({
  initial: 3,
  maximum: 10,
  element: "anyfunc", // 仅存储函数引用
});

let index = 0;
table.set(
  index,
  new WebAssembly.Function(
    { parameters: ["i32"], results: [] },
    sanitizedConsoleLog
  )
); // table 索引 0 绑定到 sanitizedConsoleLog

// ...

const { instance } = await WebAssembly.instantiate(bytes, {
  env: {
    table: table,
    memory: wasmMemory,
    log_function_index: index, // log_func_ptr 指针指向 table 索引 0
  },
});

// ...

// 调用安全的日志函数
instance.exports.safe_log(messagePtr);
```

> JavaScript 进程中定义的函数不能直接设置到 `table` 上，因为 JavaScript Function 不具有类型定义。`WebAssembly.Function` 提供了为 JavaScript Function 提供类型定义的方法，但截至目前为止 `WebAssembly.Function` 尚未实现，还在提案中。

### 线程的管理

WebAssembly 代码执行时间长度无法预测，且 WebAssembly 和调用方同一个线程中运行，如果在 JavaScript 主线程上调用 wasm 接口，大概率阻塞 UI 线程。所以一般地，我们会启用一个 worker 来执行 WebAssembly ，避免卡死。

## emscripten 胶水代码

这么看，WebAssembly 的使用还是比较复杂的，要搞清楚导出接口列表和参数，熟悉内存的使用，做好 JavaScript 函数的映射，除了要能用以外，还要保障安全。有没有办法简化这些操作呢？有的，朋友，有的。

还记得上一篇我们得到的编译产物里面有一个 `.js` 结尾的文件吗？这个文件就是所谓的**胶水代码**，胶水代码是 JavaScript 和 WebAssembly 之间的信使，简化了 WebAssembly 的操作流程，它提供这些功能：

- 加载和初始化 WebAssembly 模块
- 提供 JavaScript 和 WebAssembly 之间的接口
- 实现 C/C++ 标准库的函数（如文件 I/O、内存管理）

胶水代码的输出是一个函数，接受一个注入对象作为参数，输出一个包含所有 wasm 导出功能对象。函数的声明为：

```typescript
(moduleArg = {}): Module
```

实际上胶水代码会将输入的 `moduleArg` 注入到 `Module` 对象中，`moduleArg` 用于提供必要的 JavaScript 函数供 wasm 代码调用，比如指定 `std::print` 到 `console.log` ，我们就可以在初始化时这样定义：

```javascript
let moduleArg = {
  print: function (text: string) {
    console.log("stdout: " + text);
  },
};
```

> 胶水代码可以导出为立即执行函数，适合全局注入，注入的对象名称是 `Module` ；也可以导出为 esmodule、umd 等模块。导出的模式取决于编译参数的设置，全局注入的对象名称也可以通过参数设置，这一块将在编译优化篇章介绍。

WebAssembly 实例的导出函数全部都挂载到输出的 `Module` 上，通过 `ccall` 调用，或者使用 `cwrap` 转换成 JavaScript 函数。除此之外，根据编译参数 `-s EXPORTED_RUNTIME_METHODS` 配置挂载工具函数，比如虚拟文件系统 I/O ，内存管理接口等。

清楚了胶水代码的运行方式，那么如何使用 WebAssembly 也就呼之欲出了：

![食用指南](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7a2bf539ptd6ka4u2pv5.png)

## 小试牛刀

这里展示一个调用的例子，我们读取一个 tiff 文件，并将 tiff 的信息读取出来。文件目录：

```bash
├── CANYrelief1-geo.tif
├── gdal.worker.ts
├── gdal3WebAssembly.data
├── gdal3WebAssembly.js
├── gdal3WebAssembly.wasm
└── index.ts
```

index.ts 为入口，通过实例化一个 `GdalWorker` 开启线程，gdal3WebAssembly 开头的 3 个文件是通过编译得到的产物，如果忘了这部分内容可以去看看上一篇，全部的调用功能都在 gdal.worker.ts 文件里，代码如下：

```typescript
import CModule from "./gdal3WebAssembly.js";
// 以资源地址的方式引入 wasm 文件
import wasm from "./gdal3WebAssembly.wasm?url";

// GDAL 对象，映射 GDAL 导出函数
let GDAL = {};

// 指向 emscripten 虚拟文件系统
let FS = {};
const SRCPATH = "/src";

let Module = {
  locateFile: () => wasm,
  onRuntimeInitialized() {
    // 注册 GDAL 全部驱动
    Module.ccall("GDALAllRegister", null, [], []);

    GDAL.GDALOpen = Module.cwrap("GDALOpen", "number", ["string"]);
    GDAL.GDALClose = Module.cwrap("GDALClose", "number", ["number"]);
    // 注册 gdalinfo 指令
    GDAL.GDALInfo = Module.cwrap("GDALInfo", "string", ["number", "number"]);

    // 挂载 FS 对象
    FS = Module.FS;
  },
};

/**
 * 初始化 Module
 */
function init() {
  return CModule(Module);
}

/**
 * 读取 tiff 文件信息
 * @param files tiff 文件
 */
function getTiffInfo(files: [File]) {
  // 创建工作目录
  FS.mkdir(SRCPATH);
  // 挂载 tiff 文件
  FS.mount(
    Module.WORKERFS,
    {
      files: files,
    },
    SRCPATH
  );

  // 打开文件，获得文件句柄
  const dataset = GDAL.GDALOpen(SRCPATH + "/" + files[0].name);
  // 读取信息
  const info = GDAL.GDALInfo(dataset);

  return info;
}

/**
 * 拉取资源
 */
function fetchtiff() {
  return fetch("/api/tiff/CANYrelief1-geo.tif").then((res) => res.blob());
}

self.onmessage = () => {
  fetchtiff().then((blob) => {
    console.log(blob);
    const file = new File([blob], "CANYrelief1-geo.tiff", {
      type: "image/tiff",
    });

    init().then(() => {
      const result = getTiffInfo([file]);
      console.log(result);
    });
  });
};
```

emscripten 在构建胶水代码的时候会将 wasm 文件的位置默认设置在和胶水代码同一个目录，如果我们更改文件位置，或者使用工程化工具管理代码的时候，胶水代码会找不到 wasm 文件，最终会加载失败。注意看第 13 行，我们在注入 Module 的时候提供一个 `locateFile` 函数，函数的返回值是 wasm 资源地址，这里的写法**非常适合工程化**。胶水代码在寻找 wasm 文件之前会调用这个函数，如果这个函数返回值有效，则会使用这个返回值作为 wasm 路径去加载文件。

当代码顺利读取到 wasm 文件，实例化成功之后，会执行 `onRuntimeInitialized()` 函数，此时 WebAssembly 代码已经悉数加载完毕，且 Module 的注入也已经完成，可以在这里执行初始化的代码。从第 15 行我们开始在 JavaScript 中挂载 GDAL ，第一步便是注册 GDAL 驱动，这部分可以参考 GDAL 的[文档](https://gdal.org/en/stable/api/raster_c_api.html#_CPPv415GDALAllRegisterv)，示例代码仅仅展示一下 GDAL 的功能，所以只注册了 `GDALOpen` 、 `GDALClose` 和 `GDALInfo` 三个函数，然后注入到 `GDAL` 对象中。最后注入 `FS` 对象。

> 注意，`cwrap` 只是将 C 函数封装成 JavaScript 函数，没有被 `cwrap` 封装的其他 C 函数也已经加载到内存里了。

第 39 行开始使用 GDAL 。[`gdalinfo`](https://gdal.org/en/stable/programs/gdalinfo.html#gdalinfo) 命令接受一个 `<dataset_name>` 参数，这个参数代表文件句柄。在这里我们使用虚拟文件系统挂载 tiff 文件，并用 `GDALOpen` 命令读取这个文件得到 `dataset`，最后作为参数调用 `GDALInfo` 。以下是输出信息：

```
Driver: GTiff/GeoTIFF
Files: /src/CANYrelief1-geo.tiff
Size is 2800, 2800
Coordinate System is:
ENGCRS["WGS 84 / Pseudo-Mercator",
    EDATUM["Unknown engineering datum"],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1,
                ID["EPSG",9001]]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1,
                ID["EPSG",9001]]]]
Data axis to CRS axis mapping: 1,2
Origin = (-12249462.599999999627471,4629559.794860946945846)
Pixel Size = (13.284000000000001,-13.285397060378999)
Metadata:
  AREA_OR_POINT=Area
  TIFFTAG_DATETIME=2017:04:01 20:24:57
  TIFFTAG_RESOLUTIONUNIT=2 (pixels/inch)
  TIFFTAG_SOFTWARE=Adobe Photoshop CC (Macintosh)
  TIFFTAG_XRESOLUTION=72
  TIFFTAG_YRESOLUTION=72
Image Structure Metadata:
  COMPRESSION=LZW
  INTERLEAVE=PIXEL
  PREDICTOR=2
Corner Coordinates:
Upper Left  (-12249462.600, 4629559.795)
Lower Left  (-12249462.600, 4592360.683)
Upper Right (-12212267.400, 4629559.795)
Lower Right (-12212267.400, 4592360.683)
Center      (-12230865.000, 4610960.239)
Band 1 Block=2800x31 Type=Byte, ColorInterp=Red
Band 2 Block=2800x31 Type=Byte, ColorInterp=Green
Band 3 Block=2800x31 Type=Byte, ColorInterp=Blue
```

## 结语

本篇介绍了如何 WebAssembly ，在后面的篇章，将会介绍

1. 如何优化编译，使产物更小
2. emscripten 胶水代码有哪些魔法

这些内容。
