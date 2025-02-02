# mp-html

> 一个强大的小程序富文本组件

![star](https://badgen.net/github/stars/jin-yufeng/mp-html)
![forks](https://badgen.net/github/forks/jin-yufeng/mp-html)
![last-commit](https://badgen.net/github/last-commit/jin-yufeng/mp-html)
[![Coverage Status](https://coveralls.io/repos/github/jin-yufeng/mp-html/badge.svg?branch=master)](https://coveralls.io/github/jin-yufeng/mp-html?branch=master)
![license](https://badgen.net/github/license/jin-yufeng/mp-html)

## 功能介绍
- 支持在多个主流的小程序平台和 `uni-app` 中使用
- 支持丰富的标签（包括 `table`、`video`、`svg` 等）
- 支持丰富的事件效果（自动预览图片、链接处理等）
- 支持设置占位图（加载中、出错时、预览时）
- 支持锚点跳转、长按复制等丰富功能
- 支持大部分 *html* 实体
- 丰富的插件（关键词搜索、内容 **编辑** 等）
- 效率高、容错性强且轻量化（`≈24.5KB`，`9KB gzipped`）

查看 [功能介绍](https://jin-yufeng.gitee.io/mp-html/#/overview/feature) 了解更多

## 使用方法
### 原生平台
- `npm` 方式
  1. 在项目目录下安装组件包

     ```bash
     npm install mp-html
     ```
  2. 开发者工具中勾选 `使用 npm 模块` 并点击 `工具 - 构建 npm`
  3. 在需要使用页面的 `json` 文件中添加

     ```json
     {
       "usingComponents": {
         "mp-html": "mp-html"
       }
     }
     ```
  4. 在需要使用页面的 `wxml` 文件中添加

     ```html
     <mp-html content="{{html}}" />
     ```
  5. 在需要使用页面的 `js` 文件中添加

     ```javascript
     Page({
       onLoad() {
         this.setData({
           html: '<div>Hello World!</div>'
         })
       }
     })
     ```
- 源码方式
  1. 将源码中对应平台的代码包（`dist/platform`）拷贝到 `components` 目录下，更名为 `mp-html`
  2. 在需要使用页面的 `json` 文件中添加

     ```json
     {
       "usingComponents": {
         "mp-html": "/components/mp-html/index"
       }
     }
     ```
  
  后续步骤同上

查看 [快速开始](https://jin-yufeng.gitee.io/mp-html/#/overview/quickstart) 了解更多

### uni-app
- 源码方式
  1. 将源码中 `dist/uni-app` 内的内容拷贝到项目根目录下  
     可以直接通过 [插件市场](https://ext.dcloud.net.cn/plugin?id=805) 引入
  2. 在需要使用页面的 `vue` 文件中添加

     ```vue
     <template>
       <view>
         <mp-html :content="html" />
       </view>
     </template>
     <script>
       import mpHtml from '@/components/mp-html/mp-html'
       export default {
         // HBuilderX 2.5.5+ 可以通过 easycom 自动引入
         components: {
           mpHtml
         },
         data() {
           return {
             html: '<div>Hello World!</div>'
           }
         }
       }
     </script>
     ```
- `npm` 方式
  1. 在项目目录下安装组件包

     ```bash
     npm install mp-html
     ```
  2. 在需要使用页面的 `vue` 文件中添加

     ```vue
     <template>
       <view>
         <mp-html :content="html" />
       </view>
     </template>
     <script>
       import mpHtml from 'mp-html/dist/uni-app/components/mp-html/mp-html'
       export default {
         // 不可省略
         components: {
           mpHtml
         },
         data() {
           return {
             html: '<div>Hello World!</div>'
           }
         }
       }
     </script>
     ```

  如果在 `nvue` 中使用还要将 `dist/uni-app/static` 目录下的内容拷贝到项目的 `static` 目录下，否则无法运行  

查看 [快速开始](https://jin-yufeng.gitee.io/mp-html/#/overview/quickstart) 了解更多

## 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|:---:|:---:|:---:|---|
| content | String |  | 用于渲染的 html 字符串 |
| copy-link | Boolean | true | 是否允许外部链接被点击时自动复制 |
| domain | String |  | 主域名（用于链接拼接） |
| error-img | String |  | 图片出错时的占位图链接 |
| lazy-load | Boolean | false | 是否开启图片懒加载 |
| loading-img | String |  | 图片加载过程中的占位图链接 |
| pause-video | Boolean | true | 是否在播放一个视频时自动暂停其他视频 |
| preview-img | Boolean | true | 是否允许图片被点击时自动预览 |
| scroll-table | Boolean | false | 是否给每个表格添加一个滚动层使其能单独横向滚动 |
| selectable | Boolean | false | 是否开启文本长按复制 |
| set-title | Boolean | true | 是否将 title 标签的内容设置到页面标题 |
| show-img-menu | Boolean | true | 是否允许图片被长按时显示菜单 |
| tag-style | Object |  | 设置标签的默认样式 |
| use-anchor | Boolean | false | 是否使用锚点链接 |

查看 [属性](https://jin-yufeng.gitee.io/mp-html/#/basic/prop) 了解更多

## 组件事件

| 名称 | 触发时机 |
|:---:|---|
| load | dom 树加载完毕时 |
| ready | 图片加载完毕时 |
| error | 发生渲染错误时 |
| imgtap | 图片被点击时 |
| linktap | 链接被点击时 |

查看 [事件](https://jin-yufeng.gitee.io/mp-html/#/basic/event) 了解更多

## api
组件实例上提供了一些 `api` 方法可供调用

| 名称 | 作用 |
|:---:|---|
| in | 将锚点跳转的范围限定在一个 scroll-view 内 |
| navigateTo | 锚点跳转 |
| getText | 获取文本内容 |
| getRect | 获取富文本内容的位置和大小 |
| setContent | 设置富文本内容 |
| imgList | 获取所有图片的数组 |

查看 [api](https://jin-yufeng.gitee.io/mp-html/#/advanced/api) 了解更多

## 插件扩展  
除基本功能外，本组件还提供了丰富的扩展，可按照需要选用

| 名称 | 作用 |
|:---:|---|
| audio | 音乐播放器 |
| editable | 富文本编辑 |
| emoji | 解析 emoji |
| highlight | 代码块高亮显示 |
| markdown | 渲染 markdown |
| search | 关键词搜索 |
| style | 匹配 style 标签中的样式 |
| txv-video | 使用腾讯视频 |

查看 [插件](https://jin-yufeng.gitee.io/mp-html/#/advanced/plugin) 了解更多

## 使用案例

| 富文本插件 | 欢喜商城 | 多么生活 | 米兔旅行 | 全品作业小助手 | 古典文学名著阅读 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| ![富文本插件](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/富文本插件.jpg) | ![欢喜商城](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/欢喜商城.png) | ![多么生活](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/多么生活.jpg) | ![米兔旅行](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/米兔旅行.png) | ![全品作业小助手](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/全品作业小助手.jpg) | ![古典文学名著阅读](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/古典文学名著阅读.jpg) |

| APP 比比 | 源创智造 | 程序员技术之旅 | Geek 时代 | 典典博客 | 咚咚阅读 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| ![APP比比](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/APP比比.jpg) | ![源创智造](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/源创智造.png) | ![程序员技术之旅](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/程序员技术之旅.jpg) | ![Geek时代](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/Geek时代.jpg) | ![典典博客](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/典典博客.jpg) | ![咚咚阅读](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/case/咚咚阅读.png) |

以上排名不分先后，更多可见 [使用案例收集](https://github.com/jin-yufeng/mp-html/issues/27)（欢迎添加）  

## 许可与支持
- 许可  
  您可以免费的使用（包括商用）、复制或修改本组件 [MIT License](https://github.com/jin-yufeng/mp-html/blob/master/LICENSE)  
  不可用于任何违法用途  
  在用于生产环境前务必经过充分测试，由插件 `bug` 带来的损失概不负责（可以自行修改源码）  

- 支持  
  ![支持](https://gitee.com/jin-yufeng/mp-html/raw/master/docs/assets/sponsor.png)   

## 更新日志
- v2.0.2 (20210108)
  1. `U` `uni-app` 包微信端利用 `virtualHost` 去除夹层，加快渲染
  2. `F` 修复了部分情况下 `flex` 布局显示不正确的问题
  3. `F` 修复了设置 `loading-img` 会导致懒加载失效的问题
  4. `F` 修复了头条原生包部分情况下表格显示不正确的问题
  5. `F` 修复了 `uni-app` 的 `h5` 和 `app` 端部分插件样式无法应用的问题
  6. `F` 修复了 `uni-app` 包没有自动将 `data-src` 设置为 `src` 的问题
  7. `F` 修复了 `uni-app` 包的 `nvue` 端 `getRect` 方法无法使用的问题
  8. `F` 修复了 `uni-app` 包运行到华为快应用可能报错的问题
  9. `F` 修复了在低版本 taro 中使用可能无法正确解析的问题 [详细](https://github.com/jin-yufeng/mp-html/issues/248)
  10. `F` 修复了 `highlight` 插件 `pre` 和 `code` 之间有空白符时无法高亮的问题
  11. `F` 修复了 `editable` 插件清空内容后插入可能报错的问题

- v2.0.1 (20210101)
  1. `F` 修复了 `a` 标签自动跳转到不存在页面时可能报错的问题
  2. `F` 修复了含合并单元格的表格设置列宽可能导致显示不正确的问题 [详细](https://github.com/jin-yufeng/mp-html/issues/239)
  3. `F` 修复了表格中的图片可能错位的问题 [详细](https://github.com/jin-yufeng/mp-html/issues/194)
  4. `F` 修复了原生包使用 `editable` 插件点击标签时可能报错的问题
  5. `F` 修复了 `uni-app` 的 `h5` 和 `app` 端可能无法使用 `iframe` 和 `embed` 标签的问题 [详细](https://github.com/jin-yufeng/mp-html/issues/245)
  6. `F` 修复了 uni-app 使用部分插件会报错的问题 [详细](https://github.com/jin-yufeng/mp-html/issues/246)

  从 `1.x` 的升级方法可见 [更新指南](https://jin-yufeng.gitee.io/mp-html/#/changelog/changelog?id=v200)

查看 [更新日志](https://jin-yufeng.gitee.io/mp-html/#/changelog/changelog) 了解更多
