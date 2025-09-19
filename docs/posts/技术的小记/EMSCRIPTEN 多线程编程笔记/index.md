---
createDate: 2025/09/19
tags: WebAssembly, EMSCRIPTEN, 多线程, pthread
---

# EMSCRIPTEN 多线程编程笔记

[[createDate]]

[[toc]]

## 操作系统的多线程

进程是操作系统分配资源的最小单位，每创建一个新的进程，会把父进程的资源复制一份到子进程。而线程是一种轻量级的进程，不独立拥有系统资源，操作系统内核是按照线程作为调度单位来调度资源。每一个进程是由一个或者多个线程组成的。

进程中 Text、Data、BSS 和 Heap 部分线程之间共享，Stack 不共享，每个线程拥有自己独立的栈。

![进程和线程的内存资源](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hwcag6umsqdenarcv31f.png)

Linux 系统中普遍使用 pthread 库开发多线程程序，pthread 符合 POSIX 标准，提供管理和操作线程的方法，包含在 `pthread.h` 头文件中。同一个进程中，除了栈，所有线程共享同一份内存，同时因为线程的执行是并行的，所以不可避免地发生资源竞争的问题，即同一时间有多个线程试图获取或者修改同一个内存资源。当开发者小心翼翼地处理内存使用时，并行地读写内存可以带来效率提升，一旦不注意可能带来严重的问题。假设用 2 个线程执行如下代码，`counter` 的结果可能远小于 2000 ：

```c
for (int i = 0; i < 1000; i++) counter++;
```

pthread 提供了锁来解决这个问题，最常见的锁是互斥锁和读写锁。

1. 互斥锁：同一时间只能有唯一一个线程访问，使用 `pthread_mutex_t`
2. 读写锁：同一时间只能有唯一一个线程写入，允许多个线程读取， 使用 `pthread_rwlock_t`

> 这里不打算展开 Linux 多线程编程，超出了本篇讨论的重点。

## EMSCRIPTEN 的多线程

浏览器是一个多线程应用，我们在《[web 应用榨干 CPU  性能的正确姿势](https://dev.to/yangholmes/web-ying-yong-zha-gan-cpu-xing-neng-de-zheng-que-zi-shi-218n)》一文中介绍过这些线程，这里引用一张图：

![浏览器线程](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3psq8x3j384qxosrchx9.png)

这些线程由浏览器管理，开发者并不能干预，可以把这些线程看作是“不可编程”的多线程；浏览器像开发者提供了“可编程”的多线程，那就是 `Worker` 。《[web 应用榨干 CPU  性能的正确姿势](https://dev.to/yangholmes/web-ying-yong-zha-gan-cpu-xing-neng-de-zheng-que-zi-shi-218n)》介绍了在 JavaScript 中如何使用 `Worker` 实现多线程编程，并介绍了线程之间 Transferable objects 数据传输方式。 Transferable objects 有点类似 互斥锁 ，数据从一个线程传输至另一个线程的时候，不进行数据拷贝，而是传递数据所在的内存**所有权**，数据传输完成之后，只有接收线程可以访问这块数据，其他线程都无法访问；和互斥锁不同的是， Transferable objects 没有“解锁”方法，如果需要将数据“还给”发送线程，就按照 Transferable objects 的方式重新发送数据。Transferable objects 数据适用于 `ArrayBuffer` 一类数据，没有“共享”的属性。如果想要在不同的线程之间“共享”内存，就像使用真正的内存那样，就需要使用 `SharedArrayBuffer` 。

`Worker` 和 `SharedArrayBuffer` 正是 emscripten 多线程的实现基础，尽可能地实现 POSIX 标准的 pthread 功能。`Worker` 实现了独立栈和共享 Text， `SharedArrayBuffer` 实现了共享堆，和文件系统类似，也是通过替换系统函数，移花接木。

### SharedArrayBuffer

`SharedArrayBuffer` 对象表示一块二进制内存缓冲区，和 `ArrayBuffer` 类似，但 `SharedArrayBuffer` 可以被共享同时不能被 transfer 。`new SharedArrayBuffer(length)` 效果和 `calloc(nmemb, size)` 非常类似，运行之后都可以获得值**全为 0** 的内存，只不过 `SharedArrayBuffer` 长度为 `length * 8 bit` ， `calloc` 长度为 `nmemb * size bit` 。也就是说，`SharedArrayBuffer` 申请的内存是没有类型的，使用的时候需要根据实际情况构造成相应的 `TypedArray` 类型。

```JavaScript
const sab = new SharedArrayBuffer(1024);
const ta = new Uint8Array(sab);
ta[0] = 100;
console.log(ta[0]); // 100
console.log(ta[1]); // 0
worker.postMessage(sab);
```

`SharedArrayBuffer` 可以在主线程和多个 `Worker` 线程中创建、传输和修改，当多个线程同时使用同一块内存时，这块内存的修改传播到不同上下文需要花费一些时间，也就是说，修改生效不是立即的，和操作系统上多线程内存操作一样。使用上 1 节的例子，当 2 个线程执行如下代码后，`counter` 的结果可能远小于 2000 ：

```JavaScript
// 在某一个线程创建共享内存
cosnt _counter = new ShareArrayBuffer(1);
const counter = new Uint8Array(_counter);

// 在 2 个线程中执行累加
for (int i = 0; i < 1000; i++) counter[0]++;
```

JavaScript 并不采用“锁”来控制内存读写，而是提供 `Atomics` 对象来保证数据读写准确。`Atomics` 的细节请参考[文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)，这里不赘述。如果想要让 `counter` 的最终结果是 2000 ，只需要简单修改一下加法命令：

```JavaScript
for (let i = 0; i < 1000; i++) {
  Atomics.add(counter, 0, 1); // 原子加操作
}
```

`Atomics` 可以用来实现锁功能， emscripten 就是这么做的。简单地讲，使用 `Atomics.wait` 实现等待， `Atomics.compareExchange` 实现加锁，`Atomics.store` 实现解锁，`Atomics.notify` 实现通知线程。

### cross-origin isolated

使用 `SharedArrayBuffer` 必须满足两个条件：

1. 安全上下文，即 `https://`、 `wss://` 和 `localhost`
2. cross-origin isolated ，即跨源隔离

安全上下文想必大家都知道是什么含义，这里简单解析一下 cross-origin isolated（跨源隔离）。跨源隔离是一种网页的状态，此时只能在同源 `document` 共享上下文和使用 CORS 加载的资源（`<iframe>` 的话是 COEP ）。同时，浏览器将把这个源的页面**独立一个进程**来管理，意味着这个源的页面拥有独立的操作系统资源，崩溃报错不会轻易影响到其他页面。`SharedArrayBuffer` 必须在 cross-origin isolated 状态下使用，否则会找不到这个构造函数。除了 `SharedArrayBuffer` 外，cross-origin isolated 还具有其余两个特性：

1. `Performance.now()` 精度提高，提高到 5ms 甚至更高
2. `Performance.measureUserAgentSpecificMemory()` 可用

如何开启 cross-origin isolated ？在页面的响应头中添加 COEP 和 COOP ：

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

cross-origin isolated 会带来一些不便：

1. 非同源嵌入式资源无法直接加载，如 `<img>`、 `<script>`、 `<video>` 等，解决方法：
1. 在服务端设置正确的 `Access-Control-Allow-Origin` 响应头，并在标签中添加 `crossorigin`属性，如 `<img src="***" crossorigin>`
1. 使用 `CORP` ，服务端为资源设置 `Cross-Origin-Resource-Policy` 响应头
1. 代理转发，把跨域资源处理称为同源资源

1. `<iframe>` 必须显性标明跨域嵌入，否则无法加载

1. 非同源 popup `window.opener` 为 `null`

1. 无法改写 `document.domain`

是否开启多线程需要结合页面使用的资源情况来决定。

如果不确定一个页面是否符合 cross-origin isolated ，可以读取 `window.crossOriginIsolated` 嗅探，在 worker 中为 `self.crossOriginIsolated` 。无法提前预判运行环境是否跨源隔离，通常需要分别准备一套单线程方案和一套多线程方案，通过嗅探决定使用哪一种。

```JavaScript
if (window.crossOriginIsolated) {
  const myWorker = new Worker("worker-pthread.js");
  const buffer = new SharedArrayBuffer(16);
  myWorker.postMessage(buffer);
} else {
  const myWorker = new Worker("worker-single.js");
  const buffer = new ArrayBuffer(16);
  myWorker.postMessage(buffer, [buffer]);
}
```

### 主线程阻塞

WebAssembly 在主线程唤起执行通常会导致主线程阻塞，进而引发 UI 卡死。一般的做法是把 WebAssembly 放到一个独立的线程去执行，这个在前面的文档中多次提及。在 emscripten 中，由于线程由编译器管理，根据当前硬件状况自动合理分配，如果此时手动再增加一个线程，可能会导致线程分配不合理。解决这个问题有两个方案：

1. 手动指定可用线程数。 `-sPTHREAD_POOL_SIZE=<expression>` 参数用来指定可用线程数，接受一个数字或一个 JavaScript 表示式。一般地我们会选择不传这个参数或者传入 `navigator.hardwareConcurrency` 。当开发者想要手动维护启动线程时，可以为启动线程保留一个线程数，设置为 `-sPTHREAD_POOL_SIZE="navigator.hardwareConcurrency-1"`
2. 使用 `-sPROXY_TO_PTHREAD` 参数。添加这个参数后，c 程序中的 `main()` 函数会被替换成一个新的线程，在这个线程中运行原本的 `main()` 函数。相当于是方法 1 的自动化版本。有时候我们开发的 WebAssembly 模块并没有 `main()` 函数，此时可以参考使用方法 1

这里建议使用 `-sPTHREAD_POOL_SIZE=<expression>` 参数，无论是否手动分配启动线程。原因是当指定了 `-sPTHREAD_POOL_SIZE=<expression>` 后，程序将提前创建好 workers ，当代码执行到 `pthread_create` 可以直接使用 worker 而不是从实例化开始，可以提高效率，并获得跟原生 c 更接近的运行效果。

> `-sPROXY_TO_PTHREAD` 和 `--proxy-to-worker` 很像，都是将 `main()` 函数代理到 worker 中，带不一样的地方在于，`--proxy-to-worker` 只是纯粹代理 `main()` ，并不支持 `pthread` 和 `SharedArrayBuffer` 。
