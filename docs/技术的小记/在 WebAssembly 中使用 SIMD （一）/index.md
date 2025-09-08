---
createDate: 2025/09/08
---

# 在 WebAssembly 中使用 SIMD （一）

[[createDate]]

[[toc]]

## WebAssembly 的 SIMD 概况

WebAssembly 的 SIMD 和 CPU 的 SIMD 是一个意思，都是指 **Single Instruction Multiple Data** (**单指令多数据**) 。SIMD 指令通过同时对多个数据执行相同的操作来实现并行数据处理，进而获得矢量运算能力，计算密集型应用，例如音视频处理、编解码器、图像处理，都采用 SIMD 提升性能。SIMD 的实现依赖于 CPU ，不同的硬件条件支持的 SIMD 能力不同，所以 SIMD 指令集很大，并且在不同架构之间有所不同，当然 WebAssembly SIMD 指令集也包含其中。另一方面， WebAssembly 作为一个通用型平台，其支持的 SIMD 指令集相对比较保守，目前仅限于固定长度 16 字节（128 位）的指令集。

目前主流的大部分虚拟机都支持 SIMD ：

- Chrome ≥ 91 (2021 年 5 月)
- Firefox ≥ 89 (2021 年 6 月)
- Safari ≥ 16.4 (2023 年 3 月)
- Node.js ≥ 16.4 (2021 年 6 月)

使用之前先看看大部分用户使用的客户端是否支持，然后考虑在项目中增加测试代码**渐进增强**。渐进增强的含义是，相同功能的 wasm 模块分别用非 SIMD 和 SIMD 指令编写，嗅探宿主对 SIMD 的支持情况，如果不支持则使用非 SIMD 模块，如果支持则使用 SIMD 模块。嗅探可以使用 [wasm-feature-detect](https://github.com/GoogleChromeLabs/wasm-feature-detect) 库。这个库专门用于测试宿主对 wasm 特性支持程度，除了 SIMD 以外，这个库还可以检查诸如 64 位内存、多线程等新特性和实验特性，并且支持摇树（Tree-shakable），对 web 应用友好。

```JavaScript
// loadWasmModule.js
import { simd } from 'wasm-feature-detect';

export default function(url, simdUrl) {
  return simd().then(isSupported => {
    return isSupported ? () => import(simdUrl) : () => import(url);
  });
}
```

## SIMD 指令集

SIMD 指令和单字节指令类似，也是算术运算、读取写入、逻辑运算这几类。使用时需要严格按照栈式指令操作，SIMD 指令汇总：

|              指令格式               |                功能描述                 |                                         示例                                          |
| :---------------------------------: | :-------------------------------------: | :-----------------------------------------------------------------------------------: |
|             读取和存储              |
|  `v128.load offset=<n> align=<m>`   |          从内存加载 128 位向量          |                     `(v128.load offset=0 align=16 (i32.const 0))`                     |
|         `v128.load8_splat`          |    加载 8 位整数并复制 16 次填充向量    |                          `(v128.load8_splat (i32.const 42))`                          |
|         `v128.load16_splat`         |    加载 16 位整数并复制 8 次填充向量    |                        `(v128.load16_splat (i32.const 1024))`                         |
|         `v128.load32_splat`         |    加载 32 位整数并复制 4 次填充向量    |                     `(v128.load32_splat (i32.const 0x12345678))`                      |
|         `v128.load64_splat`         |    加载 64 位整数并复制 2 次填充向量    |                          `(v128.load64_splat (i32.const 0))`                          |
|  `v128.store offset=<n> align=<m>`  |          存储 128 位向量到内存          |           `(v128.store offset=16 align=16 (i32.const 32) (local.get $vec))`           |
|              创建常量               |
|    `v128.const <type> <values>`     |              创建常量向量               |                             `(v128.const i32x4 0 1 2 3)`                              |
|    `v128.const <type> <values>`     |            创建浮点常量向量             |                         `(v128.const f32x4 1.0 2.0 3.0 4.0)`                          |
|            整数算术运算             |
|          `i8x16.add(a, b)`          |         8 位整数加法（16 通道）         |                      `(i8x16.add (local.get $a) (local.get $b))`                      |
|          `i16x8.sub(a, b)`          |         16 位整数减法（8 通道）         |                      `(i16x8.sub (local.get $a) (local.get $b))`                      |
|          `i32x4.mul(a, b)`          |         32 位整数乘法（4 通道）         |                      `(i32x4.mul (local.get $a) (local.get $b))`                      |
|          `i64x2.add(a, b)`          |         64 位整数加法（2 通道）         |                      `(i64x2.add (local.get $a) (local.get $b))`                      |
|    `i8x16.add_saturate_s(a, b)`     |           8 位有符号饱和加法            |                `(i8x16.add_saturate_s (local.get $a) (local.get $b))`                 |
|    `i16x8.sub_saturate_u(a, b)`     |           16 位无符号饱和减法           |                `(i16x8.sub_saturate_u (local.get $a) (local.get $b))`                 |
|            整数比较运算             |
|          `i8x16.eq(a, b)`           |      8 位整数相等比较（返回掩码）       |                      `(i8x16.eq (local.get $a) (local.get $b))`                       |
|         `i32x4.lt_s(a, b)`          |         32 位有符号整数小于比较         |                     `(i32x4.lt_s (local.get $a) (local.get $b))`                      |
|         `i16x8.gt_u(a, b)`          |         16 位无符号整数大于比较         |                     `(i16x8.gt_u (local.get $a) (local.get $b))`                      |
|              浮点运算               |
|          `f32x4.add(a, b)`          |         32 位浮点加法（4 通道）         |                      `(f32x4.add (local.get $a) (local.get $b))`                      |
|          `f64x2.mul(a, b)`          |         64 位浮点乘法（2 通道）         |                      `(f64x2.mul (local.get $a) (local.get $b))`                      |
|          `f32x4.min(a, b)`          |        32 位浮点最小值（4 通道）        |                      `(f32x4.min (local.get $a) (local.get $b))`                      |
|           `f64x2.sqrt(a)`           |        64 位浮点平方根（2 通道）        |                             `(f64x2.sqrt (local.get $a))`                             |
|               位运算                |
|          `v128.and(a, b)`           |                 按位与                  |                      `(v128.and (local.get $a) (local.get $b))`                       |
|           `v128.or(a, b)`           |                 按位或                  |                       `(v128.or (local.get $a) (local.get $b))`                       |
|          `v128.xor(a, b)`           |                按位异或                 |                      `(v128.xor (local.get $a) (local.get $b))`                       |
|    `v128.bitselect(a, b, mask)`     |             根据掩码选择位              |          `(v128.bitselect (local.get $a) (local.get $b) (local.get $mask))`           |
|                位移                 |
|         `i32x4.shl(a, imm)`         |         32 位整数左移（立即数）         |                      `(i32x4.shl (local.get $a) (i32.const 2))`                       |
|        `i64x2.shr_u(a, imm)`        |      64 位无符号整数右移（立即数）      |                     `(i64x2.shr_u (local.get $a) (i32.const 3))`                      |
|         `i16x8.shl(a, imm)`         |         16 位整数左移（立即数）         |                      `(i16x8.shl (local.get $a) (i32.const 4))`                       |
|              通道操作               |
|   `i8x16.extract_lane_s(idx, a)`    |         提取 8 位有符号整数通道         |                       `(i8x16.extract_lane_s 3 (local.get $a))`                       |
| `f64x2.replace_lane(idx, a, value)` |           替换 64 位浮点通道            |               `(f64x2.replace_lane 1 (local.get $a) (f64.const 3.14))`                |
|        `i8x16.swizzle(a, s)`        |          根据索引向量重排通道           |                 `(i8x16.swizzle (local.get $a) (local.get $indices))`                 |
|     `i8x16.shuffle(mask, a, b)`     |       根据掩码混洗两个向量的通道        | `(i8x16.shuffle 0 1 2 3 12 13 14 15 8 9 10 11 4 5 6 7 (local.get $a) (local.get $b))` |
|              类型转换               |
|    `i32x4.trunc_sat_f32x4_s(a)`     | 32 位浮点转 32 位有符号整数（饱和截断） |                      `(i32x4.trunc_sat_f32x4_s (local.get $a))`                       |
|     `f64x2.convert_i32x4_s(a)`      |       32 位有符号整数转 64 位浮点       |                       `(f64x2.convert_i32x4_s (local.get $a))`                        |
|    `i16x8.extend_low_i8x16_s(a)`    |  将低 8 个 8 位有符号整数扩展为 16 位   |                      `(i16x8.extend_low_i8x16_s (local.get $a))`                      |
|                其他                 |
|         `v128.any_true(a)`          |      检查向量中是否有任意通道非零       |                           `(v128.any_true (local.get $a))`                            |
|         `i8x16.all_true(a)`         |      检查所有 8 位通道是否全为非零      |                           `(i8x16.all_true (local.get $a))`                           |
|           `f32x4.ceil(a)`           |            32 位浮点向上取整            |                             `(f32x4.ceil (local.get $a))`                             |
|          `f64x2.floor(a)`           |            64 位浮点向下取整            |                            `(f64x2.floor (local.get $a))`                             |

> 指令集使用 deepseek 协助汇总，没有严格校对，如有错误请指出。

## 使用 SIMD 指令

举个例子，如果想要对一张图片进行反色处理，如果不使用 SIMD 指令集， wat 实现如下：

```wasm
(module
  (import "env" "log" (func $log (param i32)))
  ;; 导入内存
  (import "env" "memory" (memory 100))

  ;; 反色函数：原地转换 RGB 通道，跳过Alpha通道
  (func $invert (param $start i32) (param $length i32)
    (local $end i32)   ;; 结束地址
    (local $i i32)     ;; 当前字节索引

    ;; 计算结束地址 = start + length * 4
    local.get $start
    (i32.mul (local.get $length) (i32.const 4))
    i32.add
    local.set $end

    ;; 初始化循环变量 i = start
    local.get $start
    local.set $i

    (block $exit
      ;; 主循环（每次处理4个字节：R,G,B,A）
      (loop $loop

        ;; 检查是否到达结束地址
        local.get $i
        local.get $end
        i32.ge_u
        br_if $exit


        ;; 处理R通道（偏移0）
        local.get $i
        i32.const 255
        local.get $i
        i32.load8_u      ;; 加载原始R值
        i32.sub          ;; 计算255 - R
        i32.store8       ;; 存储反色后的R值

        ;; 处理G通道（偏移1）
        local.get $i
        i32.const 1
        i32.add
        i32.const 255
        local.get $i
        i32.const 1
        i32.add
        i32.load8_u      ;; 加载原始G值
        i32.sub          ;; 计算255 - G
        i32.store8       ;; 存储反色后的G值

        ;; 处理B通道（偏移2）
        local.get $i
        i32.const 2
        i32.add
        i32.const 255
        local.get $i
        i32.const 2
        i32.add
        i32.load8_u      ;; 加载原始B值
        i32.sub          ;; 计算255 - B
        i32.store8       ;; 存储反色后的B值

        ;; 跳过Alpha通道（偏移3），无需修改
        ;; 移动到下一个像素（i += 4）
        local.get $i
        i32.const 4
        i32.add
        local.set $i

        br $loop
      )
    )
  )

  ;; 导出函数
  (export "invert" (func $invert))
)
```

使用 SIMD 指令，每一步对 1 个像素点 1 个通道的操作会增强为对 4 个像素点 4 个通道的操作：

```wasm
(module
  (import "env" "log" (func $log (param i32)))
  (import "env" "memory" (memory 100))

  (func $invert (param $start i32) (param $length i32)
    (local $end i32)        ;; 结束地址
    (local $i i32)          ;; 当前地址
    (local $chunk v128)     ;; 当前处理的16字节
    (local $mask v128)      ;; alpha 通道掩码
    (local $full255 v128)   ;; 全 255 掩码

    ;; end = start + length * 4
    local.get $start
    local.get $length
    i32.const 4
    i32.mul
    ;; 数据长度可能不是 4 的倍数，这里 +3 确保数据对齐
    i32.add
    i32.const 3
    i32.add
    local.set $end

    ;; i = start
    local.get $start
    local.set $i

    ;; 常量向量：全 255
    v128.const i8x16 255 255 255 255 255 255 255 255
                     255 255 255 255 255 255 255 255
    local.set $full255

    ;; 掩码：只保留 alpha 通道（第 3,7,11,15 个字节）
    v128.const i8x16 0 0 0 255 0 0 0 255
                     0 0 0 255 0 0 0 255
    local.set $mask

    (block $exit
      (loop $loop
        ;; if (i >= end) break
        local.get $i
        local.get $end
        i32.ge_u
        br_if $exit

        ;; load 16 bytes (4 pixels)
        local.get $i
        v128.load
        local.set $chunk

        ;; tmp = 255 - chunk
        local.get $full255
        local.get $chunk
        i8x16.sub
        local.set $chunk

        ;; 用 bitselect 保留 alpha 通道：
        local.get $i
        v128.load
        local.get $chunk
        local.get $mask
        v128.bitselect
        local.set $chunk

        ;; store back
        local.get $i
        local.get $chunk
        v128.store

        ;; i += 16
        local.get $i
        i32.const 16
        i32.add
        local.set $i

        br $loop
      )
    )
  )

  (export "invert" (func $invert))
)
```

注意看第 18 到第 20 行，WebAssembly SIMD 指令一次处理 16 字节数据，对应 rgba 4 个通道的图片 4 个像素，每张图片的像素点数量有可能不是 4 的倍数，所以这里加上一个大于 3 的数字即可确保所有数据都可以被处理。但是也要注意，WebAssembly 没有内存守护，这么处理会污染内存，导致其他数据错误，此例功能单一且没有其他数据，这样操作性能最好。

最后看性能对比：

![性能对比](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/co95os03hng6cnnfqdfd.png)

上图最左边是素材原图，中间是没有使用 SIMD 指令的处理结果和用时，右边是使用 SIMD 指令的处理结果和用时。素材原图的尺寸为 928\*927 ，除了中间的圆形图案以外，其余都是透明像素。可以看到，使用 SIMD 指令的方案性能要比不使用的快 6 倍左右。实际上，素材越大，效果越明显，不过笔者发现在处理更小的图片的场景中，也有显著的提升，比如经典的 lenna 图：

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/12afnhufe7kd0zlnhv6b.png)

## 预告

下一篇将讨论，C 程序如何在 WebAssembly 中使用 SIMD 。
