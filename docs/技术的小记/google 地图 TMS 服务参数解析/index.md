---
createDate: 2023/08/17
---

# google 地图 TMS 服务参数解析

**2023/08/17**

# 1. 前言

google 地图 TMS 瓦片精细，性能卓越，免费，许多 GIS 爱好者或者开发者习惯使用这个服务作为应用的底图。但这个 api google 并没有推荐使用，所以并不能找到官方说明文档。Google TMS 服务 url 形如 [https://mt0.google.com/vt/lyrs=y&scale=2&x=6675&y=3572&z=13&s=Galile&gl=cn](https://mt0.google.com/vt/lyrs=y&scale=2&x=6675&y=3572&z=13&s=Galile&gl=cn) ，点击打开是中国广东省东莞市某地的瓦片，修改 url 参数，我们可以看到，尽管瓦片位置没有变化，但是瓦片的内容却有所不同。这就令人好奇，Google TMS 服务究竟有多少参数可以设置，每个参数的含义是什么。

本文尝试解析这些参数的含义。

# 2. Google TMS 格式

<p>https://mt{s}.google.cn/vt/[parameters]</p>

或

<p>https://mt{s}.google.com/maps/vt/[parameters]</p>

~~或~~

~~<p>https://gac-geo.googlecnapps.cn/maps/vt/[parameters]</p>~~

s 表示 cdn ，取值范围是 0 到 3 ，parameter 详见下一节。

# 3. 参数说明

- x

x 坐标

- y

y 坐标

- z

z 坐标，即缩放等级

- hl

host language ，即显示语言，值为语言码，语言码详见[支持的语言](https://developers.google.com/custom-search/docs/xml_results_appendices#interfaceLanguages) 。

- gl

geography location ，即地理位置，值为国家码，国家码详见[这里](https://developers.google.com/custom-search/docs/xml_results_appendices#countryCodes) 。

这是一个从 Google Search 推断出来的参数，设置 gl 会影响瓦片标注内容（例如巴黎，在 gl=CN 和 gl=HK 检索出来的瓦片标注的 marker 不一样）。特别地，大陆使用 GCJ-02 坐标系，如果不设置 gl=cn ，标注和底图会有偏移。

- lyrs\[@version\]

layers ，即图层。图层可以是以下选项：

h：仅路网和标注 m：带地形图的标准地图 p：带路网的地形图 r：标准地图

s：仅卫星图 t：仅地形图 y：带路网的卫星图

lyrs 可以取其中一个值，也可以取多个值组合，例如 lyrs=s,h ，代表带路网的卫星图，和 y 等效。

可以指定版本号，版本号紧跟在 lyrs 后面，用字符 @ 间隔。例如 lyrs=s@125 表示仅卫星图且版本为 125。

- scale

即放大倍数，可以是 1、2、3、4 中的一种。 瓦片标准大小是 256*256 。 scale=1 表示不放大，即标准大小； scale=2 表示放大 2 倍，即 512*512 ； scale=3 表示方法 3 倍，即 768*768 ； scale=4 表示方法 4 倍，即 1024*1024 ；

大于 4 的值将会被忽略。

- s

校验字符串。按以下规律变化，可以用以下代码计算

```javascript
"Galileo".substring(0, (3 * coord.x + coord.y) & 7);
```

# 4. 风险

免费 api 存在比较多风险

1. api 被供应商停用

2. api 变更，但供应商没有通知且不提供文档

3. 商用的法律风险
