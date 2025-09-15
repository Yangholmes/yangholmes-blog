# Blog

基于 vitepress 的个人博客项目。

## 目录结构

```bash
/root
├── README.md                # 本文件
├── docs/                    # vitepress 工作路径
|  ├── .vitepress/           # vitepress 配置文件
|  |  ├── config/
|  |  ├── config.mts
|  |  ├── theme/             # 主题配置
|  |  └── utils.ts
|  ├── posts/                # 文章目录
|  |  └── tag/               # 标签归档
|  └── public/               # 静态文件
|     ├── favicon.ico
|     ├── icon.png
|     └── robots.txt
├── package.json             # 项目配置文件
└── patches/                 # 依赖补丁
```

## roadmap

见[文档](https://yangholmes.github.io/renovation-progress)。

## License

MIT
