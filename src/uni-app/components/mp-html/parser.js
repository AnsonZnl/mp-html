/**
 * @fileoverview html 解析器
 */

// 配置
const config = {
  // 信任的标签（保持标签名不变）
  trustTags: makeMap('a,abbr,ad,audio,b,blockquote,br,code,col,colgroup,dd,del,dl,dt,div,em,fieldset,h1,h2,h3,h4,h5,h6,hr,i,img,ins,label,legend,li,ol,p,q,ruby,rt,source,span,strong,sub,sup,table,tbody,td,tfoot,th,thead,tr,title,ul,video'),

  // 块级标签（转为 div，其他的非信任标签转为 span）
  blockTags: makeMap('address,article,aside,body,caption,center,cite,footer,header,html,nav,pre,section'),

  // 要移除的标签
  ignoreTags: makeMap('area,base,canvas,embed,frame,head,iframe,input,link,map,meta,param,rp,script,source,style,textarea,title,track,wbr'),

  // 自闭合的标签
  voidTags: makeMap('area,base,br,col,circle,ellipse,embed,frame,hr,img,input,line,link,meta,param,path,polygon,rect,source,track,use,wbr'),

  // html 实体
  entities: {
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    ensp: '\u2002',
    emsp: '\u2003',
    nbsp: '\xA0',
    semi: ';',
    ndash: '–',
    mdash: '—',
    middot: '·',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”',
    bull: '•',
    hellip: '…'
  },

  // 默认的标签样式
  tagStyle: {
    // #ifndef APP-PLUS-NVUE
    address: 'font-style:italic',
    big: 'display:inline;font-size:1.2em',
    caption: 'display:table-caption;text-align:center',
    center: 'text-align:center',
    cite: 'font-style:italic',
    dd: 'margin-left:40px',
    mark: 'background-color:yellow',
    pre: 'font-family:monospace;white-space:pre',
    s: 'text-decoration:line-through',
    small: 'display:inline;font-size:0.8em',
    u: 'text-decoration:underline'
    // #endif
  }
}
const windowWidth = uni.getSystemInfoSync().windowWidth
const blankChar = makeMap(' ,\r,\n,\t,\f')
let idIndex = 0

// #ifdef H5 || APP-PLUS
config.ignoreTags.iframe = void 0
config.trustTags.iframe = true
config.ignoreTags.embed = void 0
config.trustTags.embed = true
// #endif
// #ifdef APP-PLUS-NVUE
config.ignoreTags.source = void 0
config.ignoreTags.style = void 0
// #endif

/**
 * @description 创建 map
 * @param {String} str 逗号分隔
 */
function makeMap(str) {
  var map = Object.create(null),
    list = str.split(',')
  for (var i = list.length; i--;)
    map[list[i]] = true
  return map
}


/**
 * @description 解码 html 实体
 * @param {String} str 要解码的字符串
 * @param {Boolean} amp 要不要解码 &amp;
 * @returns {String} 解码后的字符串
 */
function decodeEntity(str, amp) {
  let i = str.indexOf('&')
  while (i != -1) {
    let j = str.indexOf(';', i + 3), code
    if (j == -1)
      break
    if (str[i + 1] == '#') {
      // &#123; 形式的实体
      code = parseInt((str[i + 2] == 'x' ? '0' : '') + str.substring(i + 2, j))
      if (!isNaN(code))
        str = str.substr(0, i) + String.fromCharCode(code) + str.substr(j + 1)
    } else {
      // &nbsp; 形式的实体
      code = str.substring(i + 1, j)
      if (config.entities[code] || (code == 'amp' && amp))
        str = str.substr(0, i) + (config.entities[code] || '&') + str.substr(j + 1)
    }
    i = str.indexOf('&', i + 1)
  }
  return str
}


/**
 * @description html 解析器
 * @param {Object} vm 组件实例
 */
function parser(vm) {
  this.options = vm || {}
  this.tagStyle = Object.assign(config.tagStyle, this.options.tagStyle)
  this.imgList = vm.imgList || []
  this.plugins = vm.plugins || []
  this.attrs = Object.create(null)
  this.stack = []
  this.nodes = []
}

/**
 * @description 执行解析
 * @param {String} content 要解析的文本
 */
parser.prototype.parse = function (content) {
  // 插件处理
  for (let i = this.plugins.length; i--;)
    if (this.plugins[i].onUpdate)
      content = this.plugins[i].onUpdate(content, config) || content

  new lexer(this).parse(content)
  // 出栈未闭合的标签
  while (this.stack.length)
    this.popNode()
  return this.nodes
}

/**
 * @description 将标签暴露出来（不被 rich-text 包含）
 */
parser.prototype.expose = function () {
  // #ifndef APP-PLUS-NVUE
  for (let i = this.stack.length; i--;) {
    let item = this.stack[i]
    if (item.name == 'a' || item.c)
      return
    item.c = 1
  }
  // #endif
}

/**
 * @description 处理插件
 * @param {Object} node 要处理的标签
 * @returns {Boolean} 是否要移除此标签
 */
parser.prototype.hook = function (node) {
  for (let i = this.plugins.length; i--;)
    if (this.plugins[i].onParse && this.plugins[i].onParse(node, this) == false)
      return false
  return true
}

/**
 * @description 将链接拼接上主域名
 * @param {String} url 需要拼接的链接
 * @returns {String} 拼接后的链接
 */
parser.prototype.getUrl = function (url) {
  let domain = this.options.domain
  if (url[0] == '/') {
    // // 开头的补充协议名
    if (url[1] == '/')
      url = (domain ? domain.split('://')[0] : 'http') + ':' + url
    // 否则补充整个域名
    else if (domain)
      url = domain + url
  } else if (domain && !url.includes('data:') && !url.includes('://'))
    url = domain + '/' + url
  return url
}

/**
 * @description 解析样式表
 * @param {Object} node 标签
 * @returns {Object} 
 */
parser.prototype.parseStyle = function (node) {
  var attrs = node.attrs,
    list = (this.tagStyle[node.name] || '').split(';').concat((attrs.style || '').split(';')),
    styleObj = {}, tmp = ''

  if (attrs.id) {
    // 暴露锚点
    if (this.options.useAnchor)
      this.expose()
    else if (node.name != 'img' && node.name != 'a' && node.name != 'video' && node.name != 'audio')
      attrs.id = void 0
  }

  // #ifndef APP-PLUS-NVUE
  // 转换 width 和 height 属性
  if (attrs.width) {
    styleObj.width = parseFloat(attrs.width) + (attrs.width.includes('%') ? '%' : 'px')
    attrs.width = void 0
  }
  if (attrs.height) {
    styleObj.height = parseFloat(attrs.height) + (attrs.height.includes('%') ? '%' : 'px')
    attrs.height = void 0
  }
  // #endif

  for (let i = 0, len = list.length; i < len; i++) {
    var info = list[i].split(':')
    if (info.length < 2)
      continue
    var key = info.shift().trim().toLowerCase(),
      value = info.join(':').trim()
    // 兼容性的 css 不压缩
    if ((value[0] == '-' && value.lastIndexOf('-') > 0) || value.includes('safe'))
      tmp += `;${key}:${value}`
    // 重复的样式进行覆盖
    else if (!styleObj[key] || value.includes('import') || !styleObj[key].includes('import')) {
      // 填充链接
      if (value.includes('url')) {
        let j = value.indexOf('(') + 1
        if (j) {
          while (value[j] == '"' || value[j] == "'" || blankChar[value[j]])
            j++
          value = value.substr(0, j) + this.getUrl(value.substr(j))
        }
      }
      // 转换 rpx（rich-text 内部不支持 rpx）
      else if (value.includes('rpx'))
        value = value.replace(/[0-9.]+\s*rpx/g, $ => parseFloat($) * windowWidth / 750 + 'px')
      styleObj[key] = value
    }
  }

  node.attrs.style = tmp
  return styleObj
}

/**
 * @description 解析到标签名
 * @param {String} name 标签名
 * @private
 */
parser.prototype.onTagName = function (name) {
  this.tagName = this.xml ? name : name.toLowerCase()
  if (this.tagName == 'svg')
    this.xml = true // svg 标签内大小写敏感
}

/**
 * @description 解析到属性名
 * @param {String} name 属性名
 * @private
 */
parser.prototype.onAttrName = function (name) {
  name = this.xml ? name : name.toLowerCase()
  if (name.substr(0, 5) == 'data-') {
    // data-src 自动转为 src
    if (name == 'data-src')
      this.attrName = 'src'
    // a 和 img 标签保留 data- 的属性，可以在 imgtap 和 linktap 事件中使用
    else if (this.tagName == 'img' || this.tagName == 'a')
      this.attrName = name
    // 剩余的移除以减小大小
    else
      this.attrName = void 0
  } else {
    this.attrName = name
    this.attrs[name] = 'T' // boolean 型属性缺省设置
  }
}

/**
 * @description 解析到属性值
 * @param {String} val 属性值
 * @private
 */
parser.prototype.onAttrVal = function (val) {
  let name = this.attrName || ''
  // 部分属性进行实体解码
  if (name == 'style' || name == 'href')
    this.attrs[name] = decodeEntity(val, true)
  // 拼接主域名
  else if (name.includes('src'))
    this.attrs[name] = this.getUrl(decodeEntity(val, true))
  else if (name)
    this.attrs[name] = val
}

/**
 * @description 解析到标签开始
 * @param {Boolean} selfClose 是否有自闭合标识 />
 * @private
 */
parser.prototype.onOpenTag = function (selfClose) {
  // 拼装 node
  let node = Object.create(null)
  node.name = this.tagName
  node.attrs = this.attrs
  this.attrs = Object.create(null)

  let attrs = node.attrs,
    parent = this.stack[this.stack.length - 1],
    siblings = parent ? parent.children : this.nodes,
    close = this.xml ? selfClose : config.voidTags[node.name]

  // 转换 embed 标签
  if (node.name == 'embed') {
    // #ifndef H5 || APP-PLUS
    let src = attrs.src || ''
    // 按照后缀名和 type 将 embed 转为 video 或 audio
    if (src.includes('.mp4') || src.includes('.3gp') || src.includes('.m3u8') || (attrs.type || '').includes('video'))
      node.name = 'video'
    else if (src.includes('.mp3') || src.includes('.wav') || src.includes('.aac') || src.includes('.m4a') || (attrs.type || '').includes('audio'))
      node.name = 'audio'
    if (attrs.autostart)
      attrs.autoplay = 'T'
    attrs.controls = 'T'
    // #endif
    // #ifdef H5 || APP-PLUS
    this.expose()
    // #endif
  }

  // #ifndef APP-PLUS-NVUE
  // 处理音视频
  if (node.name == 'video' || node.name == 'audio') {
    // 设置 id 以便获取 context
    if (node.name == 'video' && !attrs.id)
      attrs.id = 'v' + idIndex++
    // 没有设置 controls 也没有设置 autoplay 的自动设置 controls
    if (!attrs.controls && !attrs.autoplay)
      attrs.controls = 'T'
    // 用数组存储所有可用的 source
    node.src = []
    if (attrs.src) {
      node.src.push(attrs.src)
      attrs.src = void 0
    }
    this.expose()
  }
  // #endif

  // 处理自闭合标签
  if (close) {
    if (!this.hook(node) || config.ignoreTags[node.name]) {
      // 通过 base 标签设置主域名
      if (node.name == 'base' && !this.options.domain)
        this.options.domain = attrs.href
      // #ifndef APP-PLUS-NVUE
      // 设置 source 标签（仅父节点为 video 或 audio 时有效）
      else if (node.name == 'source' && parent && (parent.name == 'video' || parent.name == 'audio') && attrs.src)
        parent.src.push(attrs.src)
      // #endif
      return
    }

    // 解析 style
    let styleObj = this.parseStyle(node)

    // 处理图片
    if (node.name == 'img') {
      if (attrs.src) {
        // 标记 webp
        if (attrs.src.includes('webp'))
          node.webp = 'T'
        // data url 图片如果没有设置 original-src 默认为不可预览的小图片
        if (attrs.src.includes('data:') && !attrs['original-src'])
          attrs.ignore = 'T'
        if (!attrs.ignore || node.webp || attrs.src.includes('cloud://')) {
          let i
          for (i = this.stack.length; i--;) {
            let item = this.stack[i]
            if (item.name == 'a')
              break
            // #ifndef H5 || APP-PLUS
            let style = item.attrs.style || ''
            if (style.includes('flex:') && !style.includes('flex:0') && !style.includes('flex: 0') && (!styleObj.width || !styleObj.width.includes('%'))) {
              styleObj.width = '100% !important'
              styleObj.height = ''
              for (let j = i + 1; j < this.stack.length; j++)
                this.stack[j].attrs.style = (this.stack[j].attrs.style || '').replace('inline-', '')
            } else if (style.includes('flex') && styleObj.width == '100%') {
              for (let j = i + 1; j < this.stack.length; j++) {
                let style = this.stack[j].attrs.style || ''
                if (!style.includes(';width') && !style.includes(' width') && style.indexOf('width') != 0) {
                  styleObj.width = ''
                  break
                }
              }
            } else if (style.includes('inline-block')) {
              if (styleObj.width && styleObj.width[styleObj.width.length - 1] == '%') {
                item.attrs.style += ';max-width:' + styleObj.width
                styleObj.width = ''
              } else
                item.attrs.style += ';max-width:100%'
            }
            // #endif
            item.c = 1
          }
          if (i == -1) {
            attrs.i = this.imgList.length.toString()
            let src = attrs['original-src'] || attrs.src
            // #ifndef H5 || MP-ALIPAY || APP-PLUS || MP-360
            if (this.imgList.includes(src)) {
              // 如果有重复的链接则对域名进行随机大小写变换避免预览时错位
              let i = src.indexOf('://')
              if (i != -1) {
                i += 3
                let newSrc = src.substr(0, i)
                for (; i < src.length; i++) {
                  if (src[i] == '/')
                    break
                  newSrc += Math.random() > 0.5 ? src[i].toUpperCase() : src[i]
                }
                newSrc += src.substr(i)
                src = newSrc
              }
            }
            // #endif
            this.imgList.push(src)
            // #ifdef H5 || APP-PLUS
            if (this.options.lazyLoad) {
              attrs['data-src'] = attrs.src
              attrs.src = void 0
            }
            // #endif
          } else
            attrs.ignore = 'T'
        }
      }
      if (styleObj.display == 'inline')
        styleObj.display = ''
      // #ifndef APP-PLUS-NVUE
      if (attrs.ignore) {
        styleObj['max-width'] = '100%'
        attrs.style += ';-webkit-touch-callout:none'
      }
      // #endif
      // 设置的宽度超出屏幕，为避免变形，高度转为自动
      if (parseInt(styleObj.width) > windowWidth)
        styleObj.height = void 0
      // 记录是否设置了宽高
      if (styleObj.width) {
        if (styleObj.width.includes('auto'))
          styleObj.width = ''
        else {
          node.w = 'T'
          if (styleObj.height && !styleObj.height.includes('auto'))
            node.h = 'T'
        }
      }
    } else if (node.name == 'svg') {
      siblings.push(node)
      this.stack.push(node)
      this.popNode()
      return
    }
    for (let key in styleObj)
      if (styleObj[key])
        attrs.style += `;${key}:${styleObj[key].replace(' !important', '')}`
    attrs.style = attrs.style.substr(1) || void 0
  } else {
    if (node.name == 'pre' || ((attrs.style || '').includes('white-space') && attrs.style.includes('pre')))
      this.pre = node.pre = true
    node.children = []
    this.stack.push(node)
  }

  // 加入节点树
  siblings.push(node)
}

/**
 * @description 解析到标签结束
 * @param {String} name 标签名
 * @private
 */
parser.prototype.onCloseTag = function (name) {
  // 依次出栈到匹配为止
  name = this.xml ? name : name.toLowerCase()
  let i
  for (i = this.stack.length; i--;)
    if (this.stack[i].name == name)
      break
  if (i != -1) {
    while (this.stack.length > i)
      this.popNode()
  } else if (name == 'p' || name == 'br') {
    let siblings = this.stack.length ? this.stack[this.stack.length - 1].children : this.nodes
    siblings.push({
      name,
      attrs: {}
    })
  }
}

/**
 * @description 处理标签出栈
 * @private
 */
parser.prototype.popNode = function () {
  let node = this.stack.pop(),
    attrs = node.attrs,
    children = node.children,
    parent = this.stack[this.stack.length - 1],
    siblings = parent ? parent.children : this.nodes

  if (!this.hook(node) || config.ignoreTags[node.name]) {
    // 获取标题
    if (node.name == 'title' && children.length && children[0].type == 'text' && this.options.setTitle)
      wx.setNavigationBarTitle({
        title: children[0].text
      })
    siblings.pop()
    return
  }

  if (node.pre) {
    // 是否合并空白符标识
    node.pre = this.pre = void 0
    for (let i = this.stack.length; i--;)
      if (this.stack[i].pre)
        this.pre = true
  }

  let styleObj = {}

  // 转换 svg
  if (node.name == 'svg') {
    // #ifndef APP-PLUS-NVUE
    let src = '', style = attrs.style
    attrs.style = ''
    attrs.xmlns = 'http://www.w3.org/2000/svg';
    (function traversal(node) {
      src += '<' + node.name
      for (let item in node.attrs) {
        let val = node.attrs[item]
        if (val) {
          if (item == 'viewbox')
            item = 'viewBox'
          src += ` ${item}="${val}"`
        }
      }
      if (!node.children)
        src += '/>'
      else {
        src += '>'
        for (let i = 0; i < node.children.length; i++)
          traversal(node.children[i])
        src += '</' + node.name + '>'
      }
    })(node)
    node.name = 'img'
    node.attrs = {
      src: 'data:image/svg+xml;utf8,' + src.replace(/#/g, '%23'),
      style,
      ignore: 'T'
    }
    node.children = void 0
    // #endif
    this.xml = false
    return
  }

  // #ifndef APP-PLUS-NVUE
  // 转换 align 属性
  if (attrs.align) {
    if (node.name == 'table') {
      if (attrs.align == 'center')
        styleObj['margin-inline-start'] = styleObj['margin-inline-end'] = 'auto'
      else
        styleObj.float = attrs.align
    } else
      styleObj['text-align'] = attrs.align
    attrs.align = void 0
  }

  // 转换 font 标签的属性
  if (node.name == 'font') {
    if (attrs.color) {
      styleObj.color = attrs.color
      attrs.color = void 0
    }
    if (attrs.face) {
      styleObj['font-family'] = attrs.face
      attrs.face = void 0
    }
    if (attrs.size) {
      let size = parseInt(attrs.size)
      if (!isNaN(size)) {
        if (size < 1)
          size = 1
        else if (size > 7)
          size = 7
        styleObj['font-size'] = ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large'][size - 1]
      }
      attrs.size = void 0
    }
  }
  // #endif

  // 一些编辑器的自带 class
  if ((attrs.class || '').includes('align-center'))
    styleObj['text-align'] = 'center'

  Object.assign(styleObj, this.parseStyle(node))

  if (parseInt(styleObj.width) > windowWidth)
    styleObj['max-width'] = '100%'

  // #ifndef APP-PLUS-NVUE
  if (config.blockTags[node.name])
    node.name = 'div'
  // 未知标签转为 span，避免无法显示
  else if (!config.trustTags[node.name] && !this.xml)
    node.name = 'span'

  if (node.name == 'a' || node.name == 'ad'
    // #ifdef H5 || APP-PLUS
    || node.name == 'iframe'
    // #endif
  )
    this.expose()

  // #ifdef APP-PLUS
  else if (node.name == 'video') {
    var str = '<video style="max-width:100%"'
    for (let item in attrs)
      if (attrs[item])
        str += ' ' + item + '="' + attrs[item] + '"'
    if (this.options.pauseVideo)
      str += ' onplay="for(var e=document.getElementsByTagName(\'video\'),t=0;t<e.length;t++)e[t]!=this&&e[t].pause()"'
    str += '>'
    for (let i = 0; i < node.src.length; i++)
      str += '<source src="' + node.src[i] + '">'
    str += '</video>'
    node.html = str
  }
  // #endif

  // 列表处理
  else if ((node.name == 'ul' || node.name == 'ol') && node.c) {
    let types = {
      a: 'lower-alpha',
      A: 'upper-alpha',
      i: 'lower-roman',
      I: 'upper-roman'
    }
    if (types[attrs.type]) {
      attrs.style += ';list-style-type:' + types[attrs.type]
      attrs.type = void 0
    }
    for (let i = children.length; i--;) {
      if (children[i].name == 'li')
        children[i].c = 1
    }
  }

  // 表格处理
  else if (node.name == 'table') {
    // cellpadding、cellspacing、border 这几个常用表格属性需要通过转换实现
    let padding = parseFloat(attrs.cellpadding),
      spacing = parseFloat(attrs.cellspacing),
      border = parseFloat(attrs.border)
    if (node.c) {
      // padding 和 spacing 默认 2
      if (isNaN(padding))
        padding = 2
      if (isNaN(spacing))
        spacing = 2
    }
    if (border)
      attrs.style += ';border:' + border + 'px solid gray'
    if (node.flag && node.c) {
      // 有 colspan 或 rowspan 且含有链接的表格通过 grid 布局实现
      styleObj.display = 'grid'
      if (spacing) {
        styleObj['grid-gap'] = spacing + 'px'
        styleObj.padding = spacing + 'px'
      }
      // 无间隔的情况下避免边框重叠
      else if (border)
        attrs.style += ';border-left:0;border-top:0'

      let width = [],  // 表格的列宽
        trList = [],   // tr 列表
        cells = [],    // 保存新的单元格
        map = {};      // 被合并单元格占用的格子

      (function traversal(nodes) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].name == 'tr')
            trList.push(nodes[i])
          else
            traversal(nodes[i].children || [])
        }
      })(children)

      for (let row = 1; row <= trList.length; row++) {
        let col = 1
        for (let j = 0; j < trList[row - 1].children.length; j++, col++) {
          let td = trList[row - 1].children[j]
          if (td.name == 'td' || td.name == 'th') {
            // 这个格子被上面的单元格占用，则列号++
            while (map[row + '.' + col])
              col++
            let style = td.attrs.style || '',
              start = style.indexOf('width') ? style.indexOf(';width') : 0
            // 提取出 td 的宽度
            if (start != -1) {
              let end = style.indexOf(';', start + 6)
              if (end == -1)
                end = style.length
              if (!td.attrs.colspan)
                width[col] = style.substring(start ? start + 7 : 6, end)
              style = style.substr(0, start) + style.substr(end)
            }
            style += (border ? `;border:${border}px solid gray` + (spacing ? '' : ';border-right:0;border-bottom:0') : '') + (padding ? `;padding:${padding}px` : '')
            // 处理列合并
            if (td.attrs.colspan) {
              style += `;grid-column-start:${col};grid-column-end:${col + parseInt(td.attrs.colspan)}`
              if (!td.attrs.rowspan)
                style += `;grid-row-start:${row};grid-row-end:${row + 1}`
              col += parseInt(td.attrs.colspan) - 1
            }
            // 处理行合并
            if (td.attrs.rowspan) {
              style += `;grid-row-start:${row};grid-row-end:${row + parseInt(td.attrs.rowspan)}`
              if (!td.attrs.colspan)
                style += `;grid-column-start:${col};grid-column-end:${col + 1}`
              // 记录下方单元格被占用
              for (let k = 1; k < td.attrs.rowspan; k++)
                map[(row + k) + '.' + col] = 1
            }
            if (style)
              td.attrs.style = style
            cells.push(td)
          }
        }
        if (row == 1) {
          let temp = ''
          for (let i = 1; i < col; i++)
            temp += (width[i] ? width[i] : 'auto') + ' '
          styleObj['grid-template-columns'] = temp
        }
      }
      node.children = cells
    } else {
      // 没有使用合并单元格的表格通过 table 布局实现
      if (node.c)
        styleObj.display = 'table'
      if (!isNaN(spacing))
        styleObj['border-spacing'] = spacing + 'px'
      if (border || padding) {
        // 遍历
        (function traversal(nodes) {
          for (let i = 0; i < nodes.length; i++) {
            let td = nodes[i]
            if (td.name == 'th' || td.name == 'td') {
              if (border)
                td.attrs.style = `border:${border}px solid gray;${td.attrs.style || ''}`
              if (padding)
                td.attrs.style = `padding:${padding}px;${td.attrs.style || ''}`
            } else if (td.children)
              traversal(td.children)
          }
        })(children)
      }
    }
    // 给表格添加一个单独的横向滚动层
    if (this.options.scrollTable && !(attrs.style || '').includes('inline')) {
      let table = Object.assign({}, node)
      node.name = 'div'
      node.attrs = {
        style: 'overflow:auto'
      }
      node.children = [table]
      attrs = table.attrs
    }
  } else if ((node.name == 'td' || node.name == 'th') && (attrs.colspan || attrs.rowspan)) {
    for (let i = this.stack.length; i--;)
      if (this.stack[i].name == 'table') {
        this.stack[i].flag = 1 // 指示含有合并单元格
        break
      }
  }

  // 转换 ruby
  else if (node.name == 'ruby') {
    node.name = 'span'
    for (let i = 0; i < children.length - 1; i++) {
      if (children[i].type == 'text' && children[i + 1].name == 'rt') {
        children[i] = {
          name: 'div',
          attrs: {
            style: 'display:inline-block'
          },
          children: [{
            name: 'div',
            attrs: {
              style: 'font-size:50%;text-align:start'
            },
            children: children[i + 1].children
          }, children[i]]
        }
        children.splice(i + 1, 1)
      }
    }
  }
  else if (node.c) {
    node.c = 2
    for (let i = node.children.length; i--;)
      if (!node.children[i].c || node.children[i].name == 'table')
        node.c = 1
  }

  if ((styleObj.display || '').includes('flex') && !node.c)
    for (let i = children.length; i--;) {
      let item = children[i]
      if (item.f) {
        item.attrs.style = (item.attrs.style || '') + item.f
        item.f = void 0
      }
    }
  // flex 布局时部分样式需要提取到 rich-text 外层
  let flex = parent && (parent.attrs.style || '').includes('flex')
    // #ifdef MP-WEIXIN
    // 检查基础库版本 virtualHost 是否可用
    && !(node.c && wx.getNFCAdapter)
    // #endif
    // #ifndef MP-WEIXIN || MP-QQ || MP-BAIDU || MP-TOUTIAO
    && !node.c
  // #endif
  if (flex)
    node.f = ';max-width:100%'
  // #endif

  for (let key in styleObj)
    if (styleObj[key]) {
      let val = `;${key}:${styleObj[key].replace(' !important', '')}`
      // #ifndef APP-PLUS-NVUE
      if (flex && ((key.includes('flex') && key != 'flex-direction') || key == 'align-self' || styleObj[key][0] == '-' || (key == 'width' && val.includes('%')))) {
        node.f += val
        if (key == 'width')
          attrs.style += ';width:100%'
      } else
        // #endif
        attrs.style += val
    }
  attrs.style = attrs.style.substr(1) || void 0
}

/**
 * @description 解析到文本
 * @param {String} text 文本内容
 */
parser.prototype.onText = function (text) {
  if (!this.pre) {
    // 合并空白符
    let trim = '', flag
    for (let i = 0, len = text.length; i < len; i++) {
      if (!blankChar[text[i]])
        trim += text[i]
      else {
        if (trim[trim.length - 1] != ' ')
          trim += ' '
        if (text[i] == '\n' && !flag)
          flag = true
      }
    }
    // 去除含有换行符的空串
    if (trim == ' ' && flag)
      return
    text = trim
  }
  let node = Object.create(null)
  node.type = 'text'
  node.text = decodeEntity(text)
  if (this.hook(node)) {
    let siblings = this.stack.length ? this.stack[this.stack.length - 1].children : this.nodes
    siblings.push(node)
  }
}


/**
 * @description html 词法分析器
 * @param {Object} handler 高层处理器
 */
function lexer(handler) {
  this.handler = handler
}

/**
 * @description 执行解析
 * @param {String} content 要解析的文本
 */
lexer.prototype.parse = function (content) {
  this.content = content || ''
  this.i = 0             // 标记解析位置
  this.start = 0         // 标记一个单词的开始位置
  this.state = this.text // 当前状态
  for (let len = this.content.length; this.i != -1 && this.i < len;)
    this.state()
}

/**
 * @description 检查标签是否闭合
 * @param {String} method 如果闭合要进行的操作
 * @returns {Boolean} 是否闭合
 * @private
 */
lexer.prototype.checkClose = function (method) {
  let selfClose = this.content[this.i] == '/'
  if (this.content[this.i] == '>' || selfClose && this.content[this.i + 1] == '>') {
    if (method)
      this.handler[method](this.content.substring(this.start, this.i))
    this.i += selfClose ? 2 : 1
    this.start = this.i
    this.handler.onOpenTag(selfClose)
    this.state = this.text
    return true
  }
  return false
}

/**
 * @description 文本状态
 * @private
 */
lexer.prototype.text = function () {
  this.i = this.content.indexOf('<', this.i) // 查找最近的标签
  if (this.i == -1) {
    // 没有标签了
    if (this.start < this.content.length)
      this.handler.onText(this.content.substring(this.start, this.content.length))
    return
  }
  let c = this.content[this.i + 1]
  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
    // 标签开头
    if (this.start != this.i)
      this.handler.onText(this.content.substring(this.start, this.i))
    this.start = ++this.i
    this.state = this.tagName
  } else if (c == '/' || c == '!' || c == '?') {
    if (this.start != this.i)
      this.handler.onText(this.content.substring(this.start, this.i))
    let next = this.content[this.i + 2]
    if (c == '/' && ((next >= 'a' && next <= 'z') || (next >= 'A' && next <= 'Z'))) {
      // 标签结尾
      this.i += 2
      this.start = this.i
      return this.state = this.endTag
    }
    // 处理注释
    let end = '-->'
    if (c != '!' || this.content[this.i + 2] != '-' || this.content[this.i + 3] != '-')
      end = '>'
    this.i = this.content.indexOf(end, this.i)
    if (this.i != -1) {
      this.i += end.length
      this.start = this.i
    }
  } else
    this.i++
}

/**
 * @description 标签名状态
 * @private
 */
lexer.prototype.tagName = function () {
  if (blankChar[this.content[this.i]]) {
    // 解析到标签名
    this.handler.onTagName(this.content.substring(this.start, this.i))
    while (blankChar[this.content[++this.i]]);
    if (this.i < this.content.length && !this.checkClose()) {
      this.start = this.i
      this.state = this.attrName
    }
  } else if (!this.checkClose('onTagName'))
    this.i++
}

/**
 * @description 属性名状态
 * @private
 */
lexer.prototype.attrName = function () {
  let c = this.content[this.i]
  if (blankChar[c] || c == '=') {
    // 解析到属性名
    this.handler.onAttrName(this.content.substring(this.start, this.i))
    let needVal = c == '=',
      len = this.content.length
    while (++this.i < len) {
      c = this.content[this.i]
      if (!blankChar[c]) {
        if (this.checkClose())
          return
        if (needVal) {
          // 等号后遇到第一个非空字符
          this.start = this.i
          return this.state = this.attrVal
        }
        if (this.content[this.i] == '=')
          needVal = true
        else {
          this.start = this.i
          return this.state = this.attrName
        }
      }
    }
  } else if (!this.checkClose('onAttrName'))
    this.i++
}

/**
 * @description 属性值状态
 * @private
 */
lexer.prototype.attrVal = function () {
  let c = this.content[this.i],
    len = this.content.length
  // 有冒号的属性
  if (c == '"' || c == "'") {
    this.start = ++this.i
    this.i = this.content.indexOf(c, this.i)
    if (this.i == -1)
      return
    this.handler.onAttrVal(this.content.substring(this.start, this.i))
  }
  // 没有冒号的属性
  else
    for (; this.i < len; this.i++) {
      if (blankChar[this.content[this.i]]) {
        this.handler.onAttrVal(this.content.substring(this.start, this.i))
        break
      } else if (this.checkClose('onAttrVal'))
        return
    }
  while (blankChar[this.content[++this.i]]);
  if (this.i < len && !this.checkClose()) {
    this.start = this.i
    this.state = this.attrName
  }
}

/**
 * @description 结束标签状态
 * @returns {String} 结束的标签名
 * @private
 */
lexer.prototype.endTag = function () {
  let c = this.content[this.i]
  if (blankChar[c] || c == '>' || c == '/') {
    this.handler.onCloseTag(this.content.substring(this.start, this.i))
    if (c != '>') {
      this.i = this.content.indexOf('>', this.i)
      if (this.i == -1)
        return
    }
    this.start = ++this.i
    this.state = this.text
  } else
    this.i++
}

module.exports = parser
