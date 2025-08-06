---
createDate: 2019/10/27
title: C 的 main 函数
---

### Linux C 程序入口函数 main() 小解

**2019-10-27**

Linux 系统中，C 程序总是从 `main()` 函数开始的，当用户编写好的程序在运行的时候，操作系统慧使用 `exec()` 函数运行程序。在调用 `main()` 之前，`exec()` 系统调用会先调用一个特殊的启动例程，负责从操作系统内核读取程序的命令行参数，为 `main()` 函数准备好工作环境。

`main()` 函数的定义为

```c
int main(int argc, char* argv[], char* envp[]);
```

参数 argc 表示 命令行参数的个数，即参数 argv 的长度，argv 是一个字符串数组指针，argv 的元素就是参数的内容。envp 是系统环境变量列表，存放了一组进程运行过程中会用到的环境变量。

ANSI 规定 `main()` 函数只有前两个参数，而 POSIX 则使用了一个全局的环境变量 environ 来取代 envp ，应用程序可以通过 `getenv()` 和 `putenv()` 函数来读取或者设置一个环境变量。

#### 系统如何执行 `main()` 函数

用 strace 来分析 `main()` 的执行。我们先写一段测试用的程序：

```c
#include <stdio.h>

int main(int argc, char* argv[], char* envp[]) {
    int i = 0;
    for (i = 0; i < argc; i++) {
        printf("Argument %d is %s.\n", i, argv[i]);
    }
    return 0;
}

```

接下来编译链接：

```bash
$ gcc -o main mian.c
```

得到可执行文件 main ，然后运行它

```bash
$ ./main 'arg1' "arg2" arg3
Argument 0 is ./main.
Argument 1 is arg1.
Argument 2 is arg2.
Argument 3 is arg3.
```

程序运行正确。接下来用 strace 查看系统调用情况：

```bash
$ strace ./main 'arg1' "arg2" arg3
execve("./main", ["./main", "arg1", "arg2", "arg3"], 0x7fd6828c78 /* 32 vars */) = 0
brk(NULL)                               = 0x558ddaf000
faccessat(AT_FDCWD, "/etc/ld.so.nohwcap", F_OK) = -1 ENOENT (No such file or directory)
faccessat(AT_FDCWD, "/etc/ld.so.preload", R_OK) = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=89739, ...}) = 0
mmap(NULL, 89739, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f81dba000
close(3)                                = 0
faccessat(AT_FDCWD, "/etc/ld.so.nohwcap", F_OK) = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/lib/aarch64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0\267\0\1\0\0\0 \10\2\0\0\0\0\0"..., 832) = 832
fstat(3, {st_mode=S_IFREG|0755, st_size=1341080, ...}) = 0
mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f81df8000
mmap(NULL, 1409880, PROT_READ|PROT_EXEC, MAP_PRIVATE|MAP_DENYWRITE, 3, 0) = 0x7f81c61000
mprotect(0x7f81da1000, 61440, PROT_NONE) = 0
mmap(0x7f81db0000, 24576, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x13f000) = 0x7f81db0000
mmap(0x7f81db6000, 13144, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_ANONYMOUS, -1, 0) = 0x7f81db6000
close(3)                                = 0
mprotect(0x7f81db0000, 16384, PROT_READ) = 0
mprotect(0x5585a3f000, 4096, PROT_READ) = 0
mprotect(0x7f81dfc000, 4096, PROT_READ) = 0
munmap(0x7f81dba000, 89739)             = 0
fstat(1, {st_mode=S_IFCHR|0620, st_rdev=makedev(136, 0), ...}) = 0
brk(NULL)                               = 0x558ddaf000
brk(0x558ddd0000)                       = 0x558ddd0000
write(1, "Argument 0 is ./main.\n", 22Argument 0 is ./main.
) = 22
write(1, "Argument 1 is arg1.\n", 20Argument 1 is arg1.
)   = 20
write(1, "Argument 2 is arg2.\n", 20Argument 2 is arg2.
)   = 20
write(1, "Argument 3 is arg3.\n", 20Argument 3 is arg3.
)   = 20
exit_group(0)                           = ?
+++ exited with 0 +++
```

运行程序，系统将会从 `mian()` 函数开始执行，执行系统调用 `execve()` 函数为程序开辟新的进程。执行 `execve()` 函数的时候，系统将执行 `./main` 命令中的所有参数以字符串指针的方式传递给了 `execve()` 。执行参数包含可执行文件自身，所以我们可以看到 argv 的长度为 4。

了解系统调用 `execve()` 函数可以查看[这篇](../gcc 的编译过程/)了解
