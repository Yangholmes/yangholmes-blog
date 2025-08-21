---
createDate: 2025/08/18
---

# 如何在 web 应用中使用 GDAL （三）

**2025/08/18**

这篇研究优化。

[[toc]]

## 优化的必要性

上上篇介绍了一个完整的[编译脚本](https://github.com/bugra9/gdal3.js/blob/master/Makefile)，运行这个脚本可以顺利编译出 GDAL WebAssembly 版本的产物。

![GDAL 编译产物](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4pq5z0b1xx6lz5ahztul.png)

但是这个编译结果并不适合在生产环境中使用，原因有：

1. 文件太大，核心 wasm 文件 27MB ，胶水代码 272KB ，data 文件 11 MB
2. 胶水代码大量冗余，包含 Node 环境、bash 环境的代码，且无法进行 tree shaking
3. 生产环境无需输出调试信息

其中文件过大是最致命的，构建产物全部加起来超过 38MB ，任何 web 应用都无法接受这么一个硕大文件依赖的模块。

另外，这个 Makefile 包含许多错误配置，由于 emsdk 在编译时会抛弃不支持的编译配置，这些错误并没有中断编译。本篇还将尝试解读 gdal3.js 作者的意图，修正错误的编译参数。

> 先叠甲
>
> 通过编译过程优化，GDAL 3.x 版本的 WebAssembly 编译产物可以缩小，但很难做到足够小。本篇介绍的操作对于编译 GDAL 2.x 和 OpenCV 4.x 非常有效。个中原因，需要了解 GDAL 的源码和编译机制才能分晓，已超出本系列范围，先按下不表。
>
> TODO: 添加 OpenCV 的优化对比

## 如何优化

对于 web 应用来说，资源越小越好。经典的 web 开发流程中，开发者使用现代化的前端构建工具和模块化设计，通过注入懒加载、Tree-Shaking 等方法把原本可能比较大的 JavaScript 文件缩小成比较小的文件，并且可以做到按需要加载；JavaScript 以外的文件，使用各种“加载器”转换成 JavaScript 代码的样子，也可以实现构建和优化。但这些手段在 WebAssembly 面前都不起作用了：

1. 加载器的原理是将非 \*.js 文件转换成 JavaScript 模块，例如将 \*.png 文件转换为 base64 字符串或 url 字符串并导出为模块；转换的过程中可以缩小文件，依赖于这种文件的压缩算法，压缩后的文件必须保证在不增加代码的前提下能够在客户端中使用； \*.wasm 文件可以压缩，但是目前还无法做到客户端中不增加代码就能使用
2. JavaScript Tree-Shaking 是基于字符串代码抽象语法树去除死代码，\*.wasm 是已经编译好的可执行文件，是二进制代码不是字符串，无法像 JavaScript 一样瘦身

> 能不能做一个 `*.wasm` 文件的 loader 呢？有的，其实是有的，比如说 [vite](https://vite.dev/guide/features.html#webassembly) 就可以使用 `?init` 直接加载 WebAssembly 模块并初始化，省去写拉取初始化等代码的过程，但是这个写法并不适合结合胶水代码。

既然如此，我们应该着眼于 wasm 编译阶段的优化。

### 代码分离

```makefile
WASM
```

有三个选项

- 0 - 生成 wasm.js ，wasm 代码和 js 代码合二为一
- 1 - wasm 代码和 js 代码分开输出
- 2 - 同时生成 wasm.js 和 wasm + js

wasm.js 通常用于旧版本浏览器，`-sWASM=2` 会同时输出 wasm.js 和 wasm + js ，浏览器加载独立的 wasm 失败后会自动加载 wasm.js 文件。wasm.js 将 wasm 编译成 base64 字符串保存在 js 文件中，通常会比 wasm + js 大一些。如果明确用户的浏览器版本支持 wasm ，没有必要使用 wasm.js 。

### 按需编译

> “用多少编多少”

#### 1. 库函数

通常在项目中，我们只会用到算法库中占整个库很小比例的若干几个功能，没有必要编译无用的功能；编译 C/C++ 项目时，编译器通常会自动消除死代码，可以通过以下两个参数控制：

```makefile
EXPORTED_FUNCTIONS  # 导出函数列表
```

```makefile
EXPORT_ALL  # 导出所有函数
```

注意，导出函数前面需要添加一个下划线 `_` ，例如需要导出 `add` 函数，可以这样编写

```makefile
-sEXPORTED_FUNCTIONS="['_add']""
```

#### 2. emscripten 运行时函数

```makefile
EXPORTED_RUNTIME_METHODS
```

emscripten 运行时函数，默认值是空数组。我们应该按照实际需要添加导出函数，比如需要使用虚拟文件系统时，添加 `FS` 到数组中

```makefile
-sEXPORTED_RUNTIME_METHODS="['FS']"
```

在 [gdal3.js](https://github.com/bugra9/gdal3.js/blob/master/Makefile) 项目中，导出函数列表将几乎所有支持的 GDAL 功能都列进去了，这是编译产物巨大化的关键原因。

### 调试信息

emcc 编译参数和 gcc 的大致相同，可以选择关闭生产环境中的调试信息来优化产物。和调试信息相关的配置有

```makefile
-gsource-map
-source-map-base
-O<level>
-g<level>
```

#### 1. `-gsource-map` 和 `-source-map-base`

`-gsource-map` 控制是否输出 sourcemap ，如果设置了输出 sourcemap ，调试器将会在 `<base-url>` + `<wasm-file-name>` + `.map` 位置加载 .map 文件，`<base-url>` 由参数 `-source-map-base` 设置，默认为空，也就是和 wasm 文件同一个路径。

#### 2. `-O<level>`

设置优化等级。

- `-O0` - 完全不优化，保留所有调试信息
- `-O1` - 基础优化，消除运行时断言
- `-O2` - `-O1` 基础上进一步优化，消除死代码
- `-O3` - `-O2` 基础上再优化，减小输出文件
- `-Og` - 和 `-O1` 差不多，比 `-O1` 保留更多调试信息
- `-Os` - 和 `-O3` 差不多，比 `-O3` 输出文件更小
- `-Oz` - 和 `-Os` 差不多，比 `-Os` 输出文件更小

默认值是 `-O0` ，保留所有调试信息。

> 注意，优化级别越高，编译的时间就会越长。

#### 3. `-g<level>`

调试等级，一共有四个等级

- `-g0` - 不输出任何调试信息
- `-g1` - 链接时，保留 JavaScript 中的空格
- `-g2` - 链接时，保留编译代码中的函数名称
- `-g3` - 编译为目标文件时，保留调试信息，包括 JS 空格、函数名称和 LLVM 调试信息（DWARF）（如果有的话）

如果设置为 `-g` 不带有任何数字，相当于 `-g3` 。

### 运行环境设置

默认情况下，emscripten 认为胶水代码会在不同的环境中执行，自动生成各种环境的嗅探代码和初始化代码。实际上，对于一个确定的应用而言，运行环境是固定的，没有必要产出环境嗅探。运行环境的参数是

```makefile
ENVIRONMENT
```

emscripten 支持的值有：

- node - Node.js
- web - 网页
- webview - 也是网页，特指插入 native 应用的网页，等同于 web
- worker - worker 环境
- shell - 命令行中

如果是 web 应用，只需要编译 `-sENVIRONMENT=worker` 环境即可；同理，在 Node.js 环境中只需要编译 `-sENVIRONMENT=node` 。

还有一个与运行环境相关的配置项是

```makefile
EXPORT_ES6
```

将这个配置设置为 `1` ，便可以把胶水代码输出为符合 esmodule 规范的模块。默认情况下，胶水代码输出包含环境嗅探的 CommonJS 模块和 IIFE ，在现代前端项目中无法使用 `import` 导入。对比一下两种输出的区别：

```JavaScript
// -sEXPORT_ES6=1

// ... 最后一行
;return moduleRtn}export default CModule;
```

```JavaScript
// -sEXPORT_ES6=0

// ... 最后一行
;return moduleRtn}})();if(typeof exports==="object"&&typeof module==="object"){module.exports=CModule;module.exports.default=CModule}else if(typeof define==="function"&&define["amd"])define([],()=>CModule);
```

### 文件系统

某些算法库，如 GDAL ，需要依赖操作系统的文件系统读写文件和输出输出，emscripten 实现了一套基于 JavaScript 的内存文件系统。如果项目中没有使用文件系统，可以不使用，配置文件系统的参数是

```makefile
FILESYSTEM
```

编译文件系统，如果代码引用了 stdio.h 和 fprintf ，会自动开启，如果代码是纯计算，可以手动关闭。

> emscripten 的文件系统随 Module 导出，可以通过 `Module.FS` 访问

### 其他

#### 1. polyfill

```makefile
POLYFILL
```

是否添加 polyfill 支持旧版浏览器，默认值是 `true` 。一般需要支持旧版浏览器的项目，都会在统一的地方添加 polyfill ，无需 emscripten 再添加，建议关闭 polyfill 。

#### 2. 使用 BOM 的 Math 库

```makefile
JS_MATH
```

可以配置这个参数为 `true` 使用 JavaScript Math 库，这样就可以避免编译 libc 。如果使用 JavaScript Math 库，计算的结果可能和 libc math 库精度不一致。建议在对精度不是很敏感的项目中可以开启。

#### 3. 最小化输出

```makefile
MINIMAL_RUNTIME
```

最小化输出，不带 POSIX 功能，不带 Module ，也不带 emscripten 内置的 XHR 等模块。尽管可以获得非常小的产物，但是可能代码无法运行，不建议使用。

## 实战

### gdal3.js 编译脚本纠错

#### 1. 调试等级错误

FLAGS 文件[第 4 行](https://github.com/bugra9/gdal3.js/blob/v2.8.1/GDAL_EMCC_FLAGS.mk#L4) 定义调试等级，emcc 支持参数 0~3 ，并不支持 `-g4`。

这里明显可以看出来，当 `type` 参数为 `debug` 时，编译输出完整的调试信息。所以这里应该使用

```makefile
GDAL_EMCC_FLAGS += -O0 -g3`
```

#### 2. sourcemap 设置错误

还是在同一行，配置了 `--source-map-base` ，但并未开启 `-gsource-map` 。这里同样是当 `type` 参数为 `debug` 时，需要编译完整的 sourcemap 方便跟踪调试， `--source-map-base` 建议从参数中读取，所以这里应该使用

```makefile
GDAL_EMCC_FLAGS += -gsource-map=1 --source-map-base $(BASE_URL)
```

### gdal3.js 编译脚本优化

#### 1. 关闭所有调试信息

FLAGS 文件[第 6 行](https://github.com/bugra9/gdal3.js/blob/v2.8.1/GDAL_EMCC_FLAGS.mk#L6) 增加关闭调试的配置

```makefile
GDAL_EMCC_FLAGS += -Oz -g0
```

#### 2. 指定运行环境

```makefile
GDAL_EMCC_FLAGS += -s ENVIRONMENT=worker -s EXPORT_ES6=1
```

#### 3. 减少导出函数

例如上一篇，我们在代码中值用到了 `GDALOpen` 、 `GDALInfo` 和 `GDALClose` ，那么我们就只导出这三个函数：

```makefile
GDAL_EMCC_FLAGS += -s EXPORTED_FUNCTIONS="[\
  '_malloc',\
  '_free',\
  '_CSLCount',\
  '_GDALOpen',\
  '_GDALClose',\
  '_GDALInfo'\
]"
```

emscripten 提供的运行时函数也不需要太多，只导出用得上的：

```makefile
GDAL_EMCC_FLAGS += -s EXPORTED_RUNTIME_METHODS="[\
  'ccall',\
  'cwrap',\
  'FS'\
]"
```

### 结果

![优化结果](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/42xw0fgo2xmmjwkfn4ke.png)

wasm 文件减小了 6177075Bytes ，瘦身了 22.44% ； js 文件减小了 18299Bytes ，瘦身 10.21% 。

## 结语

后面的篇章我们将会讨论：

1. emscripten 的虚拟文件系统
2. \*.data 是什么，有什么用，如何优化 \*.data
