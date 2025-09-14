---
createDate: 2019/11/23
---

# Node.js 驱动步进电机

[[createDate]]

<video src="./步进电机.mp4" controls loop autoplay />

代码：

```JavaScript
const Gpio = require("onoff").Gpio;

class StepMotor {
  constructor(
    ports,
    phases = [0, 6, 4, 2],
    signal = [1, 1, 1, 0, 0, 0, 0, 0]
  ) {
    this.setPorts(ports);
    this.setInitPhases(phases);
    this.setSignal(signal);
    this.motorConfig();
  }

  gpioConfig() {
    try {
      this.gpios = this.ports && this.ports.map((e) => new Gpio(e, "out"));
    } catch (err) {
      console.error("some ports can not be initial", err);
      this.gpios = [];
    }
  }

  motorConfig(t = 10, duration = 8, cursor = 0) {
    this.t = t;
    this.duration = duration;
    this.cursor = cursor;
    this.rotate = true;
  }

  setPorts(ports) {
    if (!ports) {
      console.error("ports are needed!");
    } else if (ports.constructor !== Array) {
      console.error("ports must be Array!");
    } else if (ports.length !== 4) {
      console.error("4 ports are needed!");
    } else {
      this.ports = ports;
    }
  }

  setInitPhases(phases) {
    if (!phases) {
      console.error("phases are needed!");
    } else if (phases.constructor !== Array) {
      console.error("phases must be Array!");
    } else if (phases.length !== 4) {
      console.error("4 phases are needed!");
    } else {
      this.phases = phases;
    }
  }

  setSignal(signal) {
    if (!signal) {
      console.error("signal are needed!");
    } else if (signal.constructor !== Array) {
      console.error("signal must be Array!");
    } else {
      this.signal = signal;
    }
  }

  setup() {
    this.gpioConfig();
    // this.motorConfig();
    this.rotate = true;
    this.drive();
  }

  drive() {
    setTimeout(() => {
      this.gpios.forEach((e, i) => {
        e.writeSync(
          this.signal[(this.cursor + this.phases[i]) % this.duration]
        );
      });
      if (this.rotate) {
        this.cursor = this.cursor >= this.duration ? 0 : this.cursor + 1;
        this.drive();
      } else {
        this.clear();
      }
    }, this.t);
  }

  stop() {
    this.rotate = false;
    setTimeout(() => {
      this.clear();
    }, 0);
  }

  clear() {
    this.gpios.forEach((e) => {
      e.unexport();
    });
  }
}

module.exports = StepMotor;
```

赏析：

`setTimeout` 完全没有精度可言，用于时序要求比较高的硬件驱动完全不行。从视频上看，电机貌似运转正常，这是因为当前设备和 Node.js 进程正在执行的任务少， `setTimeout` 带来的误差只有如干毫秒，不至于影响电机驱动。

Node.js 中如何实现精确的定时器？这里有两个思路：

1. 使用 wasm `nop` 指令，一个 `nop` 消耗一个机器指令周期，目前嵌入式设备 CPU 频率普遍都是 GHz 级别，也就是可以实现**纳秒**级精度。但是在 wasm 中 `nop` 有可能不那么可靠：长时间 `nop` 可能会出发操作系统挂起， wasm 虽然比较底层但还是需要在 JavaScript 环境中运行，还是会受到虚拟机环境的影响，精度不能保证。

2. 使用 C++ addons 实现精确定时，这个方法精度最高，但是实现相对复杂。
