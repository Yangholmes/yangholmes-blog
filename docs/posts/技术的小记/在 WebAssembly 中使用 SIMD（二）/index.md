---
createDate: 2025/09/09
tags: WebAssembly, SIMD, EMSCRIPTEN
---

# 在 WebAssembly 中使用 SIMD（二）

[[createDate]]

[[toc]]

本篇讨论 C 程序 SIMD 的实现。

## 使用 emscripten 编译

emscripten 支持 SIMD 指令编译，使用之前需要引入头文件 `#include <wasm_simd128.h>` ，和 wat 一样，支持 128 位 SIMD 指令集，例如定义一个 32 位浮点数矢量：

```c
v128_t v1 = wasm_f32x4_make(1.2f, 3.4f, 5.6f, 7.8f);
```

如果想要对一个已经成熟的 C 项目启用 SIMD 指令，是否需要深入源代码，在每个 C 代码的文件中增加 `#include <wasm_simd128.h>` 并改写成 `v128_t` 的样子呢？其实并不用， emscripten 支持自动嗅探并将“串行”代码转换成“并行”代码，只需要在编译的时候增加 `-msimd128` 参数（这得益于 LLVM 的自动矢量化优化）。

> 使用 `-msimd128` 参数需要搭配 `-O2` 或者 `-O3` 参数。

上一篇使用 wat 实现了一个图片反色的函数，这里使用 C 语言实现一下：

```c
// invert-c.c
#include <stdint.h>
#include <emscripten/emscripten.h>

extern void my_log(long int value);

// 图片反色函数
void invert_colors(uint8_t *img_data, long int pixel_count)
{
  long total_bytes = pixel_count * 4;

  // 遍历所有像素数据
  for (long int i = 0; i < total_bytes; i += 4)
  {
    // 跳过 Alpha 通道（索引3），只处理 RGB 通道
    img_data[i + 0] = 255 - img_data[i + 0]; // R 通道反色
    img_data[i + 1] = 255 - img_data[i + 1]; // G 通道反色
    img_data[i + 2] = 255 - img_data[i + 2]; // B 通道反色
  }
}
```

不启用 SIMD 编译，编译命令为：

```bash
emcc invert-c.c -o invert-c.wasm \
-O3 -g3 \
-sERROR_ON_UNDEFINED_SYMBOLS=0 \
-sEXPORTED_FUNCTIONS='["_invert_colors"]' \
-sIMPORTED_MEMORY=1 \
-sINITIAL_MEMORY=6553600 \
-sALLOW_MEMORY_GROWTH=1 \
-sSTANDALONE_WASM --no-entry
```

启用 SIMD 编译，编译命令为：

```bash{2}
emcc invert-c.c -o invert-c-simd.wasm \
-msimd128 -O3 -g3 \
-sERROR_ON_UNDEFINED_SYMBOLS=0 \
-sEXPORTED_FUNCTIONS='["_invert_colors"]' \
-sIMPORTED_MEMORY=1 \
-sINITIAL_MEMORY=6553600 \
-sALLOW_MEMORY_GROWTH=1 \
-sSTANDALONE_WASM --no-entry
```

使用相同的素材进行测试：

![cats](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s1na4q1qgtzgn8alswti.png)

从左到右分别是原图、 wat 非 SIMD 、 wat SIMD 、 C 非 SIMD 、 C SIMD 处理后图片和耗时。可以看出，不启用 SIMD ，算法相同的情况下，通过 emscripten 编译的代码效率和 wat 相同，而启用 SIMD emscripten 编译的代码效率不如 wat 。为什么会有这种差别？使用 wabt `wasm2wat` 命令看看 emscripten 编译出来的算法策略是什么样的（摘抄部分关键代码）：

```wasm
...
i8x16.shuffle 0 4 8 12 16 20 24 28 0 0 0 0 0 0 0 0    ;; 使用重排取出 R 通道
...
i8x16.shuffle 0 0 0 0 0 0 0 0 0 4 8 12 16 20 24 28    ;; 处理 G B 通道
i8x16.shuffle 0 1 2 3 4 5 6 7 24 25 26 27 28 29 30 31
v128.not                                              ;; 反相
local.tee 2
;; 写回内存
v128.store8_lane offset=61 15
local.get 1
local.get 2
v128.store8_lane offset=57 14
local.get 1
local.get 2
v128.store8_lane offset=53 13
...

;; G 和 B 通道同理

...

;; 如果像素总数不是 16 的倍数，剩余部分使用非 SIMD 代码处理
i32.load8_u      ;; 取出第一个通道
i32.const -1
i32.xor          ;; 取反
i32.store8       ;; 写回内存
...
;; 其余两个通道同理
...
```

可以看出两点不同

1. 像素数量不满足 16 倍数的处理，笔者的处理方式是补全到等于或超过 16 的倍数，确保可以命中所有内存，不需要再运行非 SIMD 代码，性能会更好一些
2. emscripten 采用重排的方式将每个像素的 RGBA 通道分别取出然后取反实现反色，最后写入的时候按照字节依次写入，笔者的实现方式是全部通道取反最后再将 Alpha 通道还原，原地读写，效率会更高一些

无论是手写的 SIMD 还是 emscripten 自动转换的 SIMD ，都要比非 SIMD 代码效率高。

## shuffle 指令

`i8x16.shuffle` 是图形处理中非常常用的指令，可以用来一次性提取某个通道 128 位数据，方便后续运算。假设原始像素数据是这样排布的：

```
R0 G0 B0 A0 | R1 G1 B1 A1 | R2 G2 B2 A2 | R3 G3 B3 A3
```

接下来使用 `i8x16.shuffle` 提取 R 通道：

```wasm
i8x16.shuffle 0 4 8 12 0 0 0 0 0 0 0 0
```

得到

```
[R0 R1 R2 R3 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ??]
```

G 和 B 通道同理

```wasm
;; G
i8x16.shuffle 1 5 9 13 0 0 0 0 0 0 0 0

;; B
i8x16.shuffle 2 6 10 14 0 0 0 0 0 0 0 0
```

得到

```
[G0 G1 G2 G3 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ??]
[B0 B1 B2 B3 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ??]
```

`??` 部分无所谓是什么数据，可以填 0 ，不影响计算。

最后就是 `255 - x` 的计算，`uint` 类型中，被全 1 数减相当于按位取反，这里直接使用 `v128.not` 指令，会比减法指令更高效一些。

## 使用 emscripten SIMD 指令

最后，笔者尝试使用 emscripten SIMD 指令重新编写代码。算法的思路和 wat 版本的一致，也是通过长度补齐的方式避免像素总数不是 16 的倍数：

```c{24}
// invert-c-simd.c
#include <stdint.h>
#include <emscripten/emscripten.h>
#include <wasm_simd128.h>

extern void my_log(long int value);

void invert_colors(uint8_t *img_data, long int pixel_count)
{
  // 每个像素包含 RGBA 4个字节
  long int total_bytes = pixel_count * 4;

  // 创建常量向量：255
  const v128_t const_255 = wasm_i8x16_splat((uint8_t)(255));

  // 创建掩码向量：每个像素的前3个字节为255（RGB），最后一个字节为0（Alpha）
  const v128_t mask = wasm_v128_load((const uint8_t[]){
      0xFF, 0xFF, 0xFF, 0x00,
      0xFF, 0xFF, 0xFF, 0x00,
      0xFF, 0xFF, 0xFF, 0x00,
      0xFF, 0xFF, 0xFF, 0x00});

  // 处理完整的16字节块（4个像素）
  long int simd_chunks = (total_bytes + 15) / 16;
  for (long int i = 0; i < simd_chunks; i++)
  {
    // 读取内存
    v128_t pixels = wasm_v128_load(img_data + i * 16);

    // 反色计算：255 - value
    v128_t inverted = wasm_i8x16_sub(const_255, pixels);

    // 使用位选择保留Alpha通道不变
    v128_t result = wasm_v128_bitselect(inverted, pixels, mask);

    // 写回内存
    wasm_v128_store(img_data + i * 16, result);
  }
}
```

查看结果：

![simd 对比](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/no3lcfo5cpp7mpoe7s45.png)

左图依旧是原图，中间是 wat SIMD ，右图是 C SIMD 。可以看到，在相同的方案下，无论用什么语言来写，性能表现是一致的。

但是两种语言依旧有不同。上一篇有提到，字符补全方案有一个缺点，可能会污染其他数据，如果模块中需要实现不止一个功能的时候，需要非常小心；使用 emscripten 可以通过一些手段规避这个风险，在静态检查的时候会发现这个问题，为代码预留内存空间。

使用什么手段才能规避内存污染的风险呢？下期再讲。
