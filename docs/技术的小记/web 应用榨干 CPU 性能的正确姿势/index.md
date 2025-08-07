---
createDate: 2021/09/03
title: web 应用榨干 CPU 性能的正确姿势
---

# web 应用榨干 CPU  性能的正确姿势

**2021/09/03**

# 浏览器的线程分配

现代浏览器普遍采用多进程架构，将网络 I/O、存储、插件等功能分开不同的进程进行处理，其中最重要的，为每一个新开的 tab 都创建了独立的进程。这样做的好处显而易见：某个页面卡死不会导致整个浏览器卡死，也不会影响其他页面（也有例外，当计算机资源不足以新开进程时，浏览器会合并一些 tab 到同一个进程中）。一个 web 应用运行在一个 tab 进程中，即 渲染进程（Renderer Process）。这个进程负责整个网页运行的多种事务。一般地，会维护以下几个线程：

1. GUI 渲染线程
2. JavaScript 线程
3. 定时触发器线程
4. 事件触发线程
5. http 异步请求线程

其中，GUI 线程和 JavaScript 线程是互斥的，当 GUI 渲染开始时，JavaScript 停止解析；反过来当 JavaScript 执行时，GUI 挂起。

![浏览器线程](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3psq8x3j384qxosrchx9.png)
图片来自 [Inside look at modern web browser (part 1)](https://developer.chrome.com/blog/inside-browser-part1)

# JavaScript 单线程的优劣

JavaScript 被设计成单线程执行，那么浏览器便不需要考虑 DOM 等资源同时被多个线程操作带来的竞争问题，降低了设计的复杂度。

那么，古尔丹，代价是什么呢？JavaScript 线程和 GUI 线程互斥，当 JavaScript 线程执行稍微耗时一点的计算时，UI 被阻断，应用卡死。还有一个最大问题就是，web 应用无法完整利用 CPU 资源，也就无法满足重计算的使用场景，使得在一段很长的一段时间里， web 只能开发蝇量级甚至草量级应用。

> 蝇量级和草量级是职业拳击比赛中最轻的级别。

# Worker 和 多线程

为了解决这个问题， WebWorker 应运而生，作为 HTML5 标准的一部分加入到浏览器内核中。

- Worker 线程由主线程或者另一个 Worker 线程创建，独立运行，创建 Worker 的宿主可以在任何时候杀死被创建的 Worker；

- 主线程和 Worker 线程拥有完全独立的上下文，数据隔离，不能互相访问变量，数据通信需要调用专门的接口实现；

- Worker 线程上下文和主线程几乎一致，但 Worker 不能访问 DOM 接口。

尽管浏览器具有多线程特性，但数据隔离、 Worker 不可操作 DOM 等特性，依然保证了 JavaScript 单线程的本质。这样一来，主线程就可以专心地处理用户交互，计算密集型和高延迟的任务就交给 Worker 线程，保持 UI 流畅，用户体验满分。

# Web Workers API

Web Worker 通过宿主提供的 Web Workers API 来实现，非常灵活的是，Web Worker 也支持 Web Workers API ，意味着我们可以嵌套创建 Worker 。

通过实例化一个 Worker 对象，创建一个新的 worker 线程，Worker 挂载在 `window` 对象（ Worker 内部是 `slef` 对象）中，使用前，应该检查一下当前浏览器是否支持 Worker：

```javascript
if (!Worker) {
  alert("当前浏览器不支持 Worker ");
} else {
  // your code
}
```

Worker 是一个构造函数，接受两个参数：

- aURL ， `USVString` 类型参数，用于指定脚本文件路径。注意，这个脚本必须是同源脚本

- options ，配置参数

```javascript
let worker = new Worker("worker.js", options);
```

主线程与子线程之间通过事件进行数据通信，且数据传输是双向的。发送端调用 `postMessage()` 函数向接收端发送数据，接收端通过注册 `onmessage` 事件来接收数据，类似 iframe 通信。

```javascript
// 主线程
worker.postMessage(message, [transfer]);

// 子线程
self.onmessage = (evt) => {
  // 数据通过 data 属性访问
  const { data } = evt;
  // other code
};
```

数据传输都是**深拷贝**，即深拷贝调用方数据发送给接收方，但 Worker 专用的 `postMessage()` 比 iframe 的更加“高级”，除了待发送数据，它还支持 transfer 数组参数。

> transfer 数据接受 `Transferable` 对象，包含： `ArrayBuffer` 、 `MessagePort` 、 `ImageBitmap` 和 `OffscreenCanvas` 。

`Transferable` 是一种特殊的数据类型，区别于常规的 JavaScript 数据，`Transferable` 类型存储的是二进制数据。当宿主指定一组 transfer 数据时，实际上是将指定的二进制数据句柄传送给了子线程，并不发生数据复制，且在传送之后，子线程接管句柄所指向的数据块，同时断绝了宿主对这块数据的访问权限。这类似于 C 语言中指针的传递，相比于指针，transfer 只允许单独一个线程访问，避免了竞争。

当子线程运行结束，不再使用时，应当关闭子进程，节省系统资源：

```javascript
// 主线程
worker.terminate();
```

# 多线程编程实践

## 最佳线程数

一般地，在操作系统空闲的时候，我们利用 CPU 所有线程参与运算是最快的。BOM 上有一个只读参数 [`window.navigator.hardwareConcurrency`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency) 专门用于查询当前计算机可用的逻辑处理器数量，在开启多线程之前，查询这个参数确定最大的线程数。

程序的运行过程中，我们无法实时监控 CPU 的空闲线程数量，也就很难做到线程数动态分配。作者的经验是，无论什么时候，都开启最大线程数，至于 CPU 实际能用几个线程，如何分配线程，我们把这个任务交给浏览器来处理。

## 线程池

当某个耗时很长的模块需要反复调用时，可以对这个模块创建一个 Worker 线程池，线程池中的每一个元素对应一个 Worker 线程和线程当前使用状态:

```javascript
let workerList = [];

// 查询 CPU 线程数量，创建线程池
for (let i = 0; i < window.navigator.hardwareConcurrency; i++) {
  let newWorker = {
    worker: new Worker("cpuworker.js"),
    inUse: false,
  };
  workerList.push(newWorker);
}
```

`inUse` 为 `false` 时，表示线程闲；找到某个闲 Worker ，执行 `postMessage()` 函数，同时将 `inUse` 赋值为 `true` ，标记为线程忙，其他任务就不能再执行这个 Worker 了；Worker 执行完毕，返回数据到主线程，主线程释放线程池中对应的 Worker ，将 `inUse` 重新置为 `false` 。如果线程池里面的线程全部都为忙状态，那么就需要进入等待，直到有空闲的线程出现为止。

## Worker 嵌套

当出现庞大的数量处理场景时，我们可以把大量的数据拆分成规模较小的若干分，分别送入 Worker 中执行计算，最后再将数据拼接起来获得结果。如果在主线程中拆分和拼接超长数组，也可能会造成 UI 阻塞；如果只是将计算放入一个线程，把耗时操作从一个线程转移到另一个线程，性能并不能提高。所以这里应该采取多线程嵌套策略：主线程开启一个主 Worker 专门用于数据拆分和拼接，在拆分过程中，动态创建子 Worker 执行运算，最后在主 Worker 中汇总拼接数据，返回最终结果到主线程。

```javascript
// 主线程
const mWorker = new Worker("mainWorker.js");
mWorker.postMessage(data, [data.buffer]);
mWorker.onmessage = (e) => {
  // 获得处理后的数据
  const { data } = e;
  // 关闭主 Worker ，回收资源
  mWorker.terminate();
};

// mainWorker.js
self.onmessage = (e) => {
  const { data } = e;
  // 主 Worker 已经占用了一个线程了，这里需要减一
  const cpuNum = self.navigator.hardwareConcurrency - 1;
  let slice = data.length / cpuNum;
  // 申请一块内存，用于存放结果
  const iData = new ArrayBuffer(data.length);
  // 记录一下忙线程的数量
  let workersInUse = cpuNum;
  for (let i = 0; i < cpuNum; i++) {
    const start = i * slice;
    let end = start + slice;
    end = end > data.length ? data.length : end;
    // 平均切分数组
    const sData = data.slice(start, end);
    const subWorker = new Worker("subWorker.js");
    subWorker.postMessage(sData, [sData.buffer]);
    subWorker.onmessage = (e) => {
      const { data } = e;
      // 数组拼接
      iData.set(data, start);
      workersInUse--;
      // 关闭子 Worker ，回收资源
      subWorker.terminate();
      if (workersInUse <= 0) {
        self.postMessage(iData, [iData.buffer]);
      }
    };
  }
};

// subWorker.js
self.onmessage = (e) => {
  const { data } = e;
  // 这里执行耗时的运算
  const iData = someFuntion(data);
  self.postMessage(iData, [iData.buffer]);
};
```

> Worker 数量可以超过 CPU 可用线程数量吗？实操上是可以的，浏览器会协调实际线程的调用，但子线程数量超过硬件可以负担的最大数量时，性能并不能提升，而且反倒可能降低。

# 多线程性能对比

这里提供一个 Worker 嵌套方案的例子作为 benchmark ，线程调度方案如下：

![线程调度](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rdkxgedp0smlwjtrt5qg.png)

测试程序将对一张分辨率为 7451\*4192 位图进行像素遍历，找出颜色值不为 #000000 的像素点，并绘制为其他颜色，同时对 #000000 像素点添加噪声。对比一下在单线程、双线程和多线程之间的性能，直接看数据：

![benchmark](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wklldiqijzinn48g4m7o.png)

可以看到

1. 主线程解析，页面失去响应，持续超过 1.3 秒

2. 单开一个 Worker 线程解析，需要耗时约 1.3 秒，解析能力没有明显提升，但页面不会失去响应

3. 多开 Worker 线程解析，仅需 240 毫秒，性能提升非常明显（测试设备逻辑核心数为 16）, 性能提升了近 82%

# 限制

Worker 的使用很简单，但是有时候会有一些限制

## 脚本同源限制

Worker 脚本必须同源，且不支持 `file://` 协议，所以必须启动一个服务器容器来调试 Worker 程序。我们经常会将脚本当做资源部署到 CDN 中，应用入口和 CDN 不在同一个域中时，跨域会导致 Worker 代码加载失败。

注意到，构造函数 Worker 的第一个参数 `aURL` 类型是 `USVString` 而非 `String` ，`USVString` 支持 `DOMString` 和 `String` 两种类型，也就是说，`aURL` 不一定非得是脚本文件服务端地址，也可以是本地资源描述符。

将获取到的 Worker 代码转换成 Blob 对象，使用 `URL.createObjectURL()` 创建出 `DOMString` ，就可以作为代码的源传入 Worker 构造函数中，例如：

```javascript
let script = `console.log('hello world!');`;
let workerBlob = new Blob([script], { type: "text/javascript" });
let url = URL.createObjectURL(workerBlob);
let worker = new Worker(url);
```

还有一种做法，就是将 JavaScript 字符串代码编译成 base64 字符串，这个方法比较简单不再赘述。

> 相比起来，将脚本代码转换成 Blob 的方法比 base64 高效，推荐使用 Blob。

## 工程化问题

现代前端项目普遍采用如 webpack 、 vite 等高级工程化工具管理，可以参考 [webpack worker-loader](https://webpack.js.org/guides/web-workers) 和 [vite web-workers](https://vite.dev/guide/features.html#web-workers) 相关章节了解工程化的做法。

## api 访问限制

Worker 具有一套和宿主相似的全局变量，可以通过访问 self 对象获取全局资源。但是 Worker 无法访问 DOM ，无法使用 `alert()` `confirm()` 等函数，可以使用 `console` `debugger` 等函数进行代码调试。详细的全局变量说明可以参考[这里](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API#worker_global_contexts_and_functions)。
