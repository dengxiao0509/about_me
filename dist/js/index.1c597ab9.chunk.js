(this["webpackJsonpmy-site"] = this["webpackJsonpmy-site"] || []).push([["index"],{

/***/ "./src/articles/tech sync recursive ^\\.\\/.*\\.md$":
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./chrome_browser.md": "./src/articles/tech/chrome_browser.md",
	"./http_https.md": "./src/articles/tech/http_https.md",
	"./mvc_mvvm_mvp_flux.md": "./src/articles/tech/mvc_mvvm_mvp_flux.md",
	"./oauth.md": "./src/articles/tech/oauth.md",
	"./program_languages_features.md": "./src/articles/tech/program_languages_features.md",
	"./tcp.md": "./src/articles/tech/tcp.md"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./src/articles/tech sync recursive ^\\.\\/.*\\.md$";

/***/ }),

/***/ "./src/articles/tech/chrome_browser.md":
/***/ (function(module, exports) {

module.exports = "<h1 id=\"chrome是怎么工作的？\">Chrome是怎么工作的？</h1>\n<blockquote>\n<p>本文主要翻译自 Mariko Kosaka 的 <a href=\"https://developers.google.com/web/updates/2018/09/inside-browser-part1?hl=zh_cn\">《Inside look at modern web browser》</a>系列博客，并加上了一些扩展内容和示例。主要介绍了 Chrome 的多进程结构，并结合页面渲染流程讲解了各个进程的作用。最后，简单总结了这一过程。可以帮助大家更清晰地了解从输入URL到看到Web页面中间发生了什么。</p>\n</blockquote>\n<h2 id=\"浏览器的多进程结构\">浏览器的多进程结构</h2>\n<p>Chrome运行时，会启动多个进程，比如以下四个：</p>\n<ul>\n<li>Browser Process：\n控制浏览器本身的功能，例如收藏夹、导航栏等，以及不可见的、权限相关的功能，例如文件读写、网络请求等（everything outside of a tab）；</li>\n<li>Renderer Process：\n负责页面可见部分的渲染，一个Tab对应一个进程，所以可能会有多个；</li>\n<li>Plugin Process：\n负责插件的运行，比如flash；</li>\n<li>GPU Process：\n负责GPU tasks相关运行</li>\n</ul>\n<p>除此之外，可能还有别的，比如 Extension process，可以点击chrome菜单栏的三个点-更多工具-任务管理器查看当前正在运行的进程情况。</p>\n<p>Chrome 之所以要设计成多进程，主要有两个原因：一个是进程崩溃了不会影响别的进程，另一个是通过沙箱隔离实现不同类型进程的权限控制，比如处理用户任意输入的render进程，就不能随意访问系统文件。不过因为各个进程间通常会有一些共用模块，比如V8引擎，又不能共享内存，就会造成比较多的内存消耗。Chrome有一个优化是，控制最大进程数量，一旦超了，就会将同个site的tab放到一个进程里运行。另一方面，Chrome也在探索服务化，将各个service解偶，使得它们更便于被组合和拆分，这样就可以根据运行硬件的实际情况，决定是更多地将服务聚拢到单个进程，还是分散到不同的进程中，以便最大限度优化硬件使用。</p>\n<p>此外，Chrome 67版本以上已经使用了 Site Isolation 技术，就包括进程隔离。此前，同个页面中的所有iframe都是在一个进程中运行的，这可能会导致不同域名的安全问题（虽然同源策略已经提供了基础的安全防护）。Site Isolation 技术使得同个页面中的每个iframe都运行在不同进程中，通过进程隔离提升安全性。这不仅设计到进程的拆分，更改变了iframe之间的通信机制，同时在一个页面中调试也更复杂，所以这个特效也算是一个milestone。</p>\n<h2 id=\"navigation\">Navigation</h2>\n<p>那么，当我们输入一个URL，到能看见网页内容，这途中都经历了些什么呢？</p>\n<h3 id=\"s1---browser-process-处理在地址栏中的输入\">S1 - browser process 处理在地址栏中的输入</h3>\n<p>当我们在地址中进行输入的时候，browser process 的 UI thread 会获取输入内容，并判断输入是否为一个 URL。如果不是，则在搜索引擎中查找，如果是，就开始加载一个页面。</p>\n<h3 id=\"s2---开始-navigation\">S2 - 开始 navigation</h3>\n<ul>\n<li>UI thread 通知 network thread：嘿，我需要一个网络连接</li>\n<li>network thread 收到后，首先通过 DNS 解析域名指向的ip，然后向目标ip发起 TCP 请求，建立连接，获取内容（应用层通常是http或者https协议）</li>\n</ul>\n<h3 id=\"s3---解析请求返回\">S3 - 解析请求返回</h3>\n<p>收到返回内容后，network thread 首先会查看头部的几个自己，确定 Content-Type。如果是file，说明是一个下载请求，会转给download manager；如果是html，则交给 renderer process。同时，在这里会进行 SafeBrowsing 检查，看当前站点是否是一个恶意站点；以及Cross-Origin Read Blocking (CORB)检查。</p>\n<h3 id=\"s4---找一个-renderer-process\">S4 - 找一个 renderer process</h3>\n<p>当network thread明确该请求返回可以展示时，就会通知 UI thread 去启动或找一个空闲的 renderer process，开始接下来的渲染流程。为了优化速度，这个步骤往往会和 S2 同步执行。</p>\n<h3 id=\"s5---完成-navigation\">S5 - 完成 navigation</h3>\n<p>当 renderer process 启动之后，browser process 会将页面内容通过IPC(Inter Process Communicate)发给 renderer process。在收到确认之后，navigation阶段就结束了，browser process 会在此时更新浏览器页的相关信息，比如网站安全图标，然后再将该tab的浏览记录放入history里，以便前进/后退功能生效。</p>\n<h3 id=\"s6---开始新的-navigation\">S6 - 开始新的 navigation</h3>\n<p>在页面渲染完成后，renderer process 会给 navigation process 发回一个“完成”信号。此时，np会取消掉tab页的loading状态。</p>\n<p>如果在页面加载完成后，点击了页面中的一个外链，或者在地址栏中输入新的URL，会发生什么呢？</p>\n<p>当然，会重复navigation的步骤。不过，当前的renderer process并不会立即退出，而是会检查是否有beforeunload的事件监听。只有完成事件响应之后，才会完全退出。</p>\n<h4 id=\"service-worker-的处理\">Service Worker 的处理</h4>\n<p>Service Worker 是一个独立的进程，相当于给应用添加一层网络代理，可以用作cache，决定什么时候需要重新请求网络数据。Service Worker 是在 renderer process 中运行的！</p>\n<p>当一个 navigation 开始的时候，network process 会先检查当前域名是否对应有注册的service worker的 scope，如果有，UI thread 就会起一个 renderer process 来运行 service worker。后者可能会使用cache的数据，也可能通知 network thread 发起新的请求。Navigation Preload是一个优化手段，在起 service worker的同时，UI thread 会通知 network thread 同步去发起网络请求，并在 header 中指明，以便在可能的情况下只加载更新的部分数据。</p>\n<h2 id=\"rendering\">Rendering</h2>\n<p>介绍完 navigation，接下来我们再具体看下 render process 的工作，即 rendering，是如何将 HTML、CSS 和 JavaScript 文件变为一个可见的web页面的。</p>\n<p>一个 render process 可能包含如下几种线程：</p>\n<ul>\n<li>main thread 主线程，负责各种树的解析</li>\n<li>worker thread，负责运行部分 JS 代码（如果使用了 web worker 或者 service worker，上面已经介绍了说 service worker 是运行在 renderer process 中的）</li>\n<li>raster thread，负责将 render tree及相关的绘制信息转化为像素，便于屏幕展示</li>\n<li>compositor thread，负责将不同的layer组合成视窗可见的内容以及动画</li>\n</ul>\n<p>最后两个线程是为了使页面展示更加有效和平滑，接下来我们进一步介绍下各个线程的作用。</p>\n<h3 id=\"s1---html-parsing\">S1 - HTML Parsing</h3>\n<h4 id=\"建立dom树\">建立DOM树</h4>\n<p>当 rendering process 收到 navigation 确认的信息并开始接收 HTML 数据的时候，就开始将 HTML 内容转换成 Document Object Model（DOM），这是浏览器内部的页面表示，包括开发者可以用 JS 来与页面元素交换的数据结构和API。</p>\n<h4 id=\"子资源加载\">子资源加载</h4>\n<p>主线程在将解析HTML为DOM的时候，一个“preload scanner”也会同步运行。当发现一个img或script标签的时候，就并行加载网络资源，将请求发给 browser process 的 network thread。</p>\n<p>解析过程中，如果遇到script标签加载JS，那么解析过程会暂停，先获取JS资源并执行完成后，再继续解析（因为JS可能会改变页面的DOM结构）。我们也可以通过 async、defer（优先级Low）告诉浏览器我的JS不会操作DOM，可以和解析并行进行，又或者通过<link rel=\"preload\">告诉浏览器资源很重要，需要在第一时间加载。</p>\n<blockquote>\n<p>浏览器使用启发式算法，对网络资源的重要性做出最佳猜测，例如先加载CSS（Highest）然后再加载JS（High）和图片。不过这种猜测不是总是有效的，我们可以修改默认优先级。</p>\n</blockquote>\n<blockquote>\n<ul>\n<li>预加载：如果某些资源特别重要，我们可以通过预加载preload告诉服务器尽可能早地加载资源，加载过程不阻塞parser，且加载完成后会放到内存中不会立即执行，而是等到遇到script标签且请求的是这个资源的时候才会执行；</li>\n</ul>\n</blockquote>\n<blockquote>\n<ul>\n<li>预连接：如果有时知道资源很重要，但又不确定资源完整路径（例如版本号不确定，要先加载版本控制文件），可以通过preconnect提前与目标站点建立连接，不过会消耗CPU资源；也可以使用其子功能 dns-prefetch 预先解析 CDN 域名；</li>\n</ul>\n</blockquote>\n<blockquote>\n<ul>\n<li>预提取:  prefetch是告诉浏览器在加载完当前页面之后，有空闲的时间再去加载对应的资源。比如资源不是首屏渲染需要的，而是用户需要点击某个按钮才会需要的。浏览器会在空闲时加载资源并缓存，在需要使用时直接读取。不过如果在资源还没下载完的时候就遇到了script执行，那么浏览器会再去请求一次，造成资源浪费（preload会等待下载不会二次请求），所以确保首屏不会使用该资源。设置prefetch的资源，优先级变为Lowest。 </li>\n</ul>\n</blockquote>\n<blockquote>\n<ul>\n<li>defer：指定JS下载与parser同步进行，且页面加载完毕后，onload事件之前才执行JS；</li>\n<li>async：指定JS下载与parser同步进行，且下载完成后立即执行</li>\n</ul>\n</blockquote>\n<p>一个优化JS资源下载的示例如下：</p>\n<pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n&lt;head&gt;\n      &lt;meta charset=&quot;utf-8&quot;&gt;\n      &lt;link rel=&quot;dns-prefetch&quot; href=&quot;//i.gtimg.com/&quot;&gt;\n      &lt;link rel=&quot;preload&quot; href=&quot;//i.gtimg.com/important1.js&quot; as=&quot;script&quot;&gt;\n      &lt;link rel=&quot;preload&quot; href=&quot;//i.gtimg.com/important2.js&quot; as=&quot;script&quot;&gt;\n\n      &lt;!-- used in another page --&gt;\n      &lt;link rel=&quot;prefetch&quot; href=&quot;//i.gtimg.com/maybeUsed.js&quot;&gt;\n&lt;/head&gt;\n&lt;body&gt;\n      &lt;script type=&quot;text/javascript&quot; src=&quot;//i.gtimg.com/important1.js&quot; defer&gt;&lt;/script&gt;\n      &lt;script type=&quot;text/javascript&quot; src=&quot;//i.gtimg.com/important2.js&quot; defer&gt;&lt;/script&gt;\n&lt;/body&gt;\n&lt;/html&gt;\n\n</code></pre><h3 id=\"s2---css-parsing\">S2 - CSS Parsing</h3>\n<p>在建立完DOM树之后，render process的主线程会去解析CSS文件，通过选择符计算每个Node的style。</p>\n<h3 id=\"s3---布局\">S3 - 布局</h3>\n<p>只是有了每个节点的样式，要绘图还是不够的，还需要确定每个节点的位置。第三步，浏览器就会通过第二步的结果进一步计算，完善每个节点的大小、位置等信息。</p>\n<h3 id=\"s4---绘制\">S4 - 绘制</h3>\n<p>知道了每个节点的大小、形状、位置，我们还需要考虑层级，比如z-index的影响。这一步，主线程会根据用户设定生成 paint records，也就是每一步画什么，一步步完成最终绘制。</p>\n<p>至此，浏览器就得到了所有真正开始“画”页面之前的所有信息了。值得一提的是，在动画中，如果改变了DOM结构，那么S1-S4会在每一帧中执行，同时，因为是主线程解析，所以如果运行了JS代码，是有可能占用好几帧的时间，从而导致动画卡顿的！可以通过requestAnimationFrame优化，指定在重绘也就是下一桢开始前执行某个函数，从而将JS所需时间分散到每一桢的末尾。</p>\n<h3 id=\"s5---compositing\">S5 - Compositing</h3>\n<p>好啦，最后一步，我们就要开始画了！</p>\n<p>将第四部得到的信息，转换成像素值的步骤，我们称为 rasterize。最初的Chrome rasterize的方式，就是先rasterize当前viewpoint的内容，当页面滚动时，再重新补充缺失的部分。显而易见，这种方式是不够高效的，特别是动画的时候，一个节点位置移动，需要全部重新计算像素图。</p>\n<p>当代浏览器用了更复杂的 composite 技术，类似于将画布分层，先独立rasterize好各个层，动画或者移动视窗的时候，直接重新组合各个层形成新的帧就好，性能提高很多！如此，就将 <strong>Layout tree</strong> 转换为了 <strong>Layer tree</strong>。通常，浏览器会将有动画或者随页面滚动会变的元素独立成层，在开发者工具可以看到当前页面的分层情况。</p>\n<p>一旦 layer tree 和 paint order 信息都完成了，主线程会将结果给到 composite thread；然后，composite thread 会将大的layer拆分为小的tile，然后分发给不同的 rasterize thread。当rasterize thread 计算完成后，会将结果输出到 GPU 的内存，并将改tile对应的在layer的位置、在内存的地址等信息返回给 composite thread，后者组合生成 composite frame，通过IPC返回给 browser process，送到GPU去展示（此过程browser process的主线程不会参与，因此页面更新不需要等待样式或JS阻塞，更丝滑）。这也是为什么只涉及composite的动画比修改元素大小或位置的做法体验更好的原因。</p>\n<h2 id=\"事件响应\">事件响应</h2>\n<p>最后，让我们来看下浏览器是如何相应用户输入并更新页面的。</p>\n<p>当用户输入到来时，browser process 的 UI thread 会将事件发生的坐标等信息传给 render process 的 compositor。然后compositor会判断，这个区域是否是属于&quot;Non-Fast Scrollable Region&quot;，也就是不包含event handler的区域。如果不是，那么compositor就直接更新composite frame，从而更新页面；如果是，那它会将信息进一步传给主线程，询问JS是否需要处理事件回调，等JS应答之后再去更新composite frame。PS，主线程是通过 paint records 信息去查找对应的 target 的。</p>\n<p>所以，我们在给body绑定事件回调的时候，会将整个页面都变成“Non-Fast Scrollable Region”，即使有些区域的事件不需要主线程处理，也会因为询问主线程造成资源浪费。解决方法是加一个passive属性：</p>\n<pre><code>document.body.addEventListener(&#39;touchstart&#39;, event =&gt; {\n    if (event.cancelable &amp;&amp; event.target === area) {\n         event.preventDefault()\n    }\n }, {passive: true});\n\n</code></pre><p>加上之后，遇到 event compositor 还是会将事件传递给主线程，不过也会同时更新 frame，而不是等待主线程响应。 如果在回调中有阻止事件的逻辑，可以加上cancalable判断，是否在当时页面已经更新了。如果要禁止一些事件，那也可以直接用css禁止掉，就不会出现frame的更新了，比如</p>\n<pre><code>touch-action: pan-x; // 限制只能单指左右滑\n\n</code></pre><h2 id=\"总结\">总结</h2>\n<p>最后，我们来总结一下上面这么多的内容。</p>\n<p>首先，Chrome浏览器是有很多子进程的。Browser process 负责浏览器的除Tab外的可见部分和不可见部分，如网络请求、文件读写等；Render process 负责页面的渲染，即Tab的部分，一般一个Tab对应一个 render process。</p>\n<p>然后，展示一个页面的过程简述如下。</p>\n<p>Browser process 的 UI thread 先获取用户在地址栏输入的 URL，然后转给 network\n thread，检查安全性通过之后，network thread 负责 HTML 的加载，并把字节流通过 IPC 给 render process。</p>\n<p> 后者拿到数据后，主线程会开始进行 HTML 文件解析，生成 DOM 树，在解析过程中遇到外部资源如 JS、CSS 等，根据策略在合适的时候通知 browser process 的 network thread 去下载或自行执行 JS。生成 DOM 树之后，解析 CSS，生成 render tree（包含各节点自身样式），再通过布局生成 layout tree（包含各节点大小、位置等布局信息），接着划分层级生成 layer tree，然后加上 paint orders 信息。</p>\n<p>最后，compositing thread 会将各个 layer 划分成小的块，分发给不同的 rastering threads，后者将结果存到 CPU 内存，并把各小块的信息返回给 compositing thread。compositing thread 再整合一个 composite frame 后，传给 browser process 的 GPU，展示到屏幕上。</p>\n<p>OVER！\n到此为止，应该对浏览器的底层机制有了更清晰的了解吧？了解之后才能更懂优化！</p>\n";

/***/ }),

/***/ "./src/articles/tech/content.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "content", function() { return content; });
var content = [{
  category: '前端',
  articles: [{
    link: '/tech/program_languages_features',
    title: '从JS的三个特性谈计算机语言发展',
    abstract: 'JavaScript 语言是一门“面向对象”、“函数式编程”的“动态”语言。本文就基于这三个特性出发，介绍了语言发展的历程，希望帮助读者对不同的计算机语言有更系统的认识。',
    img: 'img/number1.png',
    showInIndex: true
  }, {
    link: '/tech/chrome_browser',
    title: 'Chrome是怎么工作的',
    abstract: '本文主要介绍了 Chrome 的多进程结构，并结合页面渲染流程讲解了各个进程的作用。最后，简单总结了这一过程。可以帮助大家更清晰地了解从输入URL到看到Web页面中间发生了什么。',
    img: 'img/number2.png',
    showInIndex: true
  }, {
    link: '/tech/mvc_mvvm_mvp_flux',
    title: 'MV*与Flux模式简析',
    abstract: '本文介绍并对比了 MVC、MVP、MVVM 几种框架模型，并以 Flux、React、Redux、Elm、Mbox、Reactive Programming 等举例分析其模型实质。',
    img: 'img/number3.png',
    showInIndex: true
  }]
}, {
  category: '网络协议',
  articles: [{
    link: '/tech/tcp',
    title: 'TCP协议介绍',
    abstract: '本文介绍了 TCP 这一面向连接、可靠的、基于字节流的运输层协议，通过对协议头、通信过程中的三次握手和四次挥手过程的详细介绍，说明了这三个特性各自的实现方式及意义。最后，还与非连接的 UDP 协议做了对比。通过阅读此文，相信您可以对TCP协议有比较全面的认识。',
    img: '',
    showInIndex: false
  }, {
    link: '/tech/http_https',
    title: 'HTTP/1.0  /1.1  /2.0 及 HTTPS 介绍和比较',
    abstract: '本文先比较了 HTTP 协议的 1.0、1.1、2.0 版本的异同，介绍了 HTTP 协议的发展。后部分介绍了基于 HTTP + SSL/TLS 的 HTTPS协议，梳理了应用层协议 HTTP 的发展。',
    img: 'img/number4.png',
    showInIndex: true
  }, {
    link: '/tech/oauth',
    title: 'Getting Started with OAuth 2.0 学习总结',
    abstract: '本文是OAuth 2.0的学习总结，主要是对Ryan Boyd的书《Getting Started with OAuth 2.0》重点内容进行翻译，并加上了自己的一些理解和总结。',
    img: '',
    showInIndex: false
  }]
}];

/***/ }),

/***/ "./src/articles/tech/http_https.md":
/***/ (function(module, exports, __webpack_require__) {

module.exports = "<h1 id=\"http10--11--20-及-https-介绍和比较\">HTTP/1.0  /1.1  /2.0 及 HTTPS 介绍和比较</h1>\n<blockquote>\n<p>本文先比较了 HTTP 协议的 1.0、1.1、2.0 版本的异同，介绍了 HTTP 协议的发展。后部分介绍了基于 HTTP + SSL/TLS 的 HTTPS协议，梳理了应用层协议 HTTP 的发展。</p>\n</blockquote>\n<p>在<a href=\"/tech/tcp\" title=\"介绍 TCP 协议的文章\">介绍 TCP 协议的文章</a>中，我们介绍了 TCP／IP 协议族的分层：</p>\n<pre><code>| 应用层 （如HTTP、FTP、TELNET）|\n|---------------------------------|\n| 运输层 （TCP或UDP） |\n| 网络层 （IP） |\n| 网络接口层 （如Ethernet）|\n\n</code></pre><p>本文将详细介绍应用层协议 HTTP，以及由此发展出的 HTTPS 协议。</p>\n<p>回顾一下，在运输层的 TCP 协议，是基于字节流的、可靠的、面向连接的协议。在 TCP 层是不会对字节流的数据做解释的，数据的组成方式及长度划分都是在 HTTP 协议层级完成的，因此一个 HTTP 通信数据可能由多个 TCP 通信完成，一个 TCP 通信里也可能包含多个 HTTP 请求的数据。</p>\n<h2 id=\"http-协议\">HTTP 协议</h2>\n<p>HTTP协议是Hyper Text Transfer Protocol（超文本传输协议）的缩写,是用于从万维网（WWW:World Wide Web ）服务器传输超文本到本地浏览器的传送协议。</p>\n<h3 id=\"特点\">特点</h3>\n<ol>\n<li><p><strong>简单快速</strong>：\n协议简单，只需指定请求路径和请求方式。因此HTTP服务器的程序简单，通信速度快。</p>\n</li>\n<li><p><strong>灵活</strong>：\n可传输多种类型的数据，在协议头 Content-Type 中说明类型。</p>\n</li>\n<li><p><strong>无连接</strong>：每次连接只处理一个请求，返回结果后就断开。可节省传输时间。</p>\n</li>\n</ol>\n<ol start=\"4\">\n<li><strong>无状态</strong>：是指协议对于事务处理没有记忆能力，各个请求独立。</li>\n</ol>\n<h3 id=\"协议请求规范\">协议请求规范</h3>\n<p>HTTP使用统一资源标识符（Uniform Resource Identifiers, URI）来传输数据和建立连接。URL（uniform resource locator）是一种特殊类型的URI，包含了用于查找某个资源的足够的信息。</p>\n<p>HTTP Request 请求格式如下：\n<img src=\"" + __webpack_require__("./src/articles/tech/img/http1.png") + "\" width=\"800\" /></p>\n<p>Response 的格式与上面类似，只是第一行由请求方法和状态码构成。</p>\n<p>关于 HTTP 协议的内容就不再展开了，接下来我们重点看一下 HTTP 1.0，HTTP 1.1 和 HTTP 2.0 的差异。</p>\n<h2 id=\"http-的优化\">HTTP 的优化</h2>\n<p>随着 Web 2.0 和移动端的发展，网络情况变得越来越复杂，资源种类也越来越多，于是人们开始了对于 HTTP 协议的不断优化。</p>\n<h3 id=\"影响因素\">影响因素</h3>\n<p>影响一个 HTTP 网络请求的因素主要有两个：<strong>带宽</strong>和<strong>延迟</strong>。</p>\n<ul>\n<li><p><strong>带宽</strong>：是指单位时间内可以传输的信息量，即bit数。带宽主要跟信号传输介质有关，随着光纤等材料的发展，带宽已经是不影响请求的瓶颈了。</p>\n</li>\n<li><p><strong>延迟</strong>：</p>\n<ul>\n<li>浏览器阻塞：浏览器会因为一些原因阻塞请求，比如对于同个域名，同时只能有4个连接，超过限制的请求会被阻塞；</li>\n<li>DNS查询：将域名解析为IP，可通过DNS缓存优化；</li>\n<li>建立连接：HTTP请求基于 TCP，浏览器最快也要在第三次握手时才能捎带 HTTP 请求报文。三次握手在高延迟场景下影响较明显，慢启动则对文件类大请求影响较大。</li>\n</ul>\n</li>\n</ul>\n<h3 id=\"http-11-vs-http-10\">HTTP 1.1 vs HTTP 1.0</h3>\n<p>相比 1.0，1.1主要有以下几个发展：</p>\n<ol>\n<li><p><strong>支持长连接</strong> （Header：Connection）</p>\n<p>HTTP 1.0 规定每次服务端发回 Response 之后，就断开 TCP 连接，下一次请求又需要重新建立 TCP 连接，显然这样会增加连接建立和断开的成本，造成带宽浪费和延迟。</p>\n<blockquote>\n<p>HTTP 1.0 的协议规范中说明，在实现服务端的 TCP 时，需要注意，在关闭 TCP 连接之前，最好确定客户端是否收到了关闭连接前的最后一个包。如果服务端关闭连接后，客户端还在发送数据（TCP的重试），服务端需要发送一个 reset 包给客户端，告知其使用的 TCP 连接已经失效，需清空这个连接收到的缓存数据。</p>\n</blockquote>\n<p>1.1 中规定，多个 HTTP 请求可共享一个 TCP 连接，通过协议头中的 Connection=keep-alive 默认开启。当浏览器完成请求资源时，将 Connection 字段置为 close，即通知服务器完成本次请求后关闭连接。</p>\n<p>例如：一个包含有许多图像的网页文件的多个请求和应答可以在一个连接中传输，但每个单独的网页文件的请求和应答仍然需要使用各自的连接，这就是所谓的 pipelining 。</p>\n<p>但是这其实也不能很好地解决多路复用的问题，如果一个请求数据过大或者速度慢，会阻塞后面的请求。</p>\n</li>\n<li><p><strong>增加 HOST 头域</strong> （Header：HOST）</p>\n<p>在HTTP1.0中认为每台服务器都绑定一个唯一的IP地址，因此，请求消息中的URL并没有传递主机名（hostname）。但随着虚拟主机技术的发展，在一台物理服务器上可以存在多个虚拟主机（Multi-homed Web Servers），并且它们共享一个IP地址。</p>\n<p>HTTP1.1的请求消息和响应消息都应支持Host头域，且请求消息中如果没有Host头域会报告一个错误（400 Bad Request）。此外，服务器应该接受以绝对路径标记的资源请求。</p>\n</li>\n<li><p><strong>带宽优化</strong></p>\n<h6 id=\"支持请求资源的某部分-（header：range）\">支持请求资源的某部分 （Header：range）</h6>\n<p>1.1 中增加了一个 range 的请求头，它允许只请求资源的某个部分。在响应消息中Content-Range头域声明了返回的这部分对象的偏移值和长度。如果服务器相应地返回了对象所请求范围的内容，则响应码为206（Partial Content），它可以防止Cache将响应误以为是完整的一个对象。这个功能可让浏览器只请求资源需要的部分，同时支持了<strong>断点续传</strong>。</p>\n<h6 id=\"只发送header-（101状态码）\">只发送header （101状态码）</h6>\n<p>HTTP/1.1加入了一个新的状态码100（Continue）。客户端事先发送一个只带头域的请求，如果服务器因为权限拒绝了请求，就回送响应码401（Unauthorized）；如果服务器接收此请求就回送响应码100，客户端就可以继续发送带实体的完整请求了。 </p>\n</li>\n<li><p><strong>消息传递</strong> （Header：Chunkedtransfer-coding）</p>\n<p>HTTP消息中可以包含任意长度的实体，通常它们使用 Content-Length来给出消息结束标志。但是，对于很多动态产生的响应，只能通过缓冲完整的消息来判断消息的大小，但这样做会加大延迟。如果不使用长连接，还可以通过连接关闭的信号来判定一个消息的结束。</p>\n<p>HTTP/1.1中引入了 Chunkedtransfer-coding 来解决上面这个问题，发送方将消息分割成若干个任意大小的数据块，每个数据块在发送时都会附上块的长度，最后用一个零长度的块作为消息结束的标志。这种方法允许发送方只缓冲消息的一个片段，避免缓冲整个消息带来的过载。</p>\n</li>\n<li><p><strong>缓存</strong> （Header：Cache-Control）</p>\n<p>1.1 优化了缓存机制，使其更灵活。比如加入了 Cache-Control 头，它支持一个可扩展的指令子集：例如 max-age 指令支持相对时间戳；private和no-store指令禁止对象被缓存。</p>\n</li>\n<li><p><strong>其他</strong></p>\n<p>除了以上5点，1.1还有很多扩展，比如新增了24个状态响应码，如409（Conflict）表示请求的资源与资源的当前状态发生冲突；410（Gone）表示服务器上的某个资源被永久性的删除，等等。</p>\n<p>同时，考虑到向上兼容，1.1 规定可以在头部加一个 Upgrade 字段，允许浏览器将请求升级为其他服务端支持的协议，如 websocket。</p>\n</li>\n</ol>\n<h3 id=\"http-20-vs-http-11\">HTTP 2.0 vs HTTP 1.1</h3>\n<p>相比1.0，2.0又有以下的优化。</p>\n<ol>\n<li><p><strong>支持多路复用</strong> （Multiplexing）</p>\n<p>HTTP 1.1 在同一时间对于同一个域名的请求数量有限制，超过限制就会阻塞请求。同时，若干个请求排队串行化单线程处理，后面的请求等待前面请求的返回才能获得执行机会，一旦有某请求超时等，后续请求只能被阻塞。</p>\n<p>多路复用底层采用<strong>增加二进制分帧层</strong>的方法，使得不改变原来的语义、首部字段的情况下提高传输性能，降低延迟。如下图所示。</p>\n<p>二进制分帧将所有传输信息分割为更小的帧，用二进制进行编码，多个请求都在同一个TCP连接上完成，可以承载任意数量的双向数据流。HTTP/2 更有效的使用TCP连接，得到性能上的提升。</p>\n<p>要分帧，就涉及到帧流控制和优先级控制。一个request对应一个id，这样一个连接上可以有多个request，每个连接的request可以随机的混杂在一起，接收方可以根据request的 id将request再归属到各自不同的服务端请求里面。同时，为了不阻塞重要的请求，对于不同的请求，也有优先级的划分。</p>\n</li>\n</ol>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/http2.jpg") + "\" width=\"800\" /></p>\n<ol start=\"2\">\n<li><p><strong>支持压缩header</strong></p>\n<p>2.0 支持头部压缩，采用HPACK算法。</p>\n<p>头块必须被发送作为帧的连续序列，以及任何其他类型，或者通过任何其他流的无交插帧。</p>\n</li>\n<li><p><strong>支持服务端推送</strong></p>\n<p>当浏览器请求一个网页时，服务器将会发回HTML，在服务器开始发送JavaScript、图片和CSS前，服务器需要等待浏览器解析HTML和发送所有内嵌资源的请求。服务器推送服务通过“推送”那些它认为客户端将会需要的内容到客户端的缓存中，以此来避免往返的延迟。</p>\n</li>\n</ol>\n<h3 id=\"总结\">总结</h3>\n<p>HTTP／1.1 在 1.0 的基础上通过长连接来减小 TCP 连接维护的成本，一定程度上优化了延迟问题，但其所采用的有序阻塞的 pipelining 仍然没能完全实现复用 TCP 连接的目的，而 2.0 通过增加一个二进制帧，真正实现了多路复用，提高了带宽的利用率，有效优化了延迟问题。</p>\n<h2 id=\"https-协议\">HTTPS 协议</h2>\n<p>HTTP 协议传输的数据都是未加密的，也就是明文的，因此使用 HTTP 协议传输隐私信息非常不安全，为了保证这些隐私数据能加密传输，于是网景公司设计了SSL（Secure Sockets Layer）协议用于对 HTTP 协议传输的数据进行加密，从而就诞生了 HTTPS。简单来说，HTTPS协议是由 HTTP + SSL/TLS 协议构建的可进行加密传输、身份认证的网络协议，要比 HTTP 协议安全。</p>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/http3.jpg") + "\"  /></p>\n<h3 id=\"ssl协议和tls协议\">SSL协议和TLS协议</h3>\n<h4 id=\"ssl-协议\">SSL 协议</h4>\n<p>SSL协议位于 TCP/IP 协议与各种应用层协议之间，为数据通讯提供安全支持。SSL协议可分为两层：SSL记录协议（SSL Record Protocol）：它建立在可靠的传输协议（如TCP）之上，为高层协议提供数据封装、压缩、加密等基本功能的支持。SSL握手协议（SSL Handshake Protocol）：它建立在SSL记录协议之上，用于在实际的数据传输开始前，通讯双方进行身份认证、协商加密算法、交换加密密钥等。</p>\n<h4 id=\"tls-协议\">TLS 协议</h4>\n<p>TLS（Transport Layer Security，传输层安全）：其前身是 SSL，它最初的几个版本（SSL 1.0、SSL 2.0、SSL 3.0）由网景公司开发，1999年从 3.1 开始被 IETF 标准化并改名，发展至今已经有 TLS 1.0、TLS 1.1、TLS 1.2 三个版本。SSL3.0和TLS1.0由于存在安全漏洞，已经很少被使用到。目前使用最广泛的是TLS 1.1、TLS 1.2。</p>\n<h3 id=\"握手过程\">握手过程</h3>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/http4.jpg") + "\" width=\"800\" /></p>\n<p>首先客户端向服务端发起 HTTPS 请求，告诉服务器 SSL 协议的版本号，以及支持的加密套件等信息。</p>\n<p>服务端会返回一个 SSL 证书。客户端拿到证书后，校验证书的有效性。如果无效，显示“无效的证书”提示；如果有效，取出证书中的公钥。</p>\n<p>客户端生成一个随机数，再用证书中的公钥将随机数进行加密，发送给服务端。</p>\n<p>服务端使用证书对应的私钥解密，获得客户端的随机数。</p>\n<p>之后，双方使用这个随机数作为公钥，通过对称加密将通信内容进行加密。</p>\n<h3 id=\"证书验证\">证书验证</h3>\n<p><strong>如何验证一个证书是否有效呢？</strong></p>\n<p>首先，我们要了解<strong>数字签名</strong>的概念。</p>\n<p>证书颁发者用自己的私钥将证书的摘要信息进行加密，生成数字签名。拿到证书的人，可以用该颁发者公开的公钥进行解密得到数字签名中的摘要，再与计算得到的证书的摘要对比，如果一致，说明改证书确实由宣称这个公钥的颁发者提供的，没有被篡改过。因为私钥只有证书颁发者自己知道，所以数字签名也是不能被伪造的。</p>\n<p>证书中一般会包含如下信息：</p>\n<ul>\n<li>证书颁发机构信息</li>\n<li>证书持有者的身份信息（网址、IP等）</li>\n<li>证书拥有者对应的加密通信内容的公钥</li>\n<li>证书颁发机构生成数字签名的算法（便于通过生成摘要校验证书有效性）</li>\n</ul>\n<p>同时，拿到证书的服务端，会保存该证书的私钥，绝对不能泄露。</p>\n<p><strong>验证证书链有效性</strong>\n<img src=\"" + __webpack_require__("./src/articles/tech/img/http5.png") + "\" width=\"800\" /></p>\n<p>根证书是预先安装在操作系统中的，被浏览器信任。同时，根证书也是自签名的。</p>\n<p>根证书会颁发一些中间证书，中间证书再给站点颁发证书。在验证站点证书有效性时，需验证整个证书颁发链，保证每个证书都有效。</p>\n<ol>\n<li><p>在拿到站点的证书时，首先要在证书中找到颁发者的信息，找到颁发者的证书，从中获取颁发者的公钥；然后用颁发者的公钥验证站点证书是否有效。</p>\n</li>\n<li><p>如果有效，且颁发者是中间证书，就需要再用更上一层根证书颁发者的公钥来验证中间证书的有效性;</p>\n</li>\n<li><p>根证书预先安装在操作系统中，是被浏览器信任的。</p>\n</li>\n</ol>\n<p>在验证一个证书未必篡改且由信任机构颁发的之后，还需要验证以下几点：</p>\n<ul>\n<li>证书是否过期</li>\n<li>证书的网站域名是否与部署此证书的网站域名一致</li>\n<li>通过检查颁发机构的证书吊销列表（或有效证书列表），看此证书是否已经被吊销</li>\n</ul>\n<p>所有信息验证无误后，客户端再取证书中的公钥，继续加密通信。</p>\n<h3 id=\"https-vs-http\">HTTPS vs HTTP</h3>\n<h4 id=\"优势\">优势</h4>\n<ol>\n<li>所有信息传播都是加密的，第三方没有证书的私钥，也就无法知道用于加密请求的公钥；</li>\n<li>通过证书可验证颁发者的身份，且能放篡改，保证持有证书的对话方是可信任的；</li>\n<li>请求无法被篡改，也无法被伪造。</li>\n</ol>\n<h4 id=\"缺点\">缺点</h4>\n<ol>\n<li>SSL 证书需要花钱，证书在服务器上的部署、更新、维护也很繁琐；</li>\n<li>HTTPS 需要多次握手，会造成一定的延迟；</li>\n<li>HTTPS 涉及到加密运算，会消耗机器 CPU 资源；</li>\n<li>证书的有效性有时难以保障，比如一些中间证书会给一些并不安全的站点颁发站点证书。         </li>\n</ol>\n";

/***/ }),

/***/ "./src/articles/tech/img/Supervising-Controller.jpg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/Supervising-Controller.186a9fa6.jpg";

/***/ }),

/***/ "./src/articles/tech/img/elm-pattern.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/elm-pattern.2b7d17d3.png";

/***/ }),

/***/ "./src/articles/tech/img/flux.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/flux.2d1f1090.png";

/***/ }),

/***/ "./src/articles/tech/img/http1.png":
/***/ (function(module, exports) {

module.exports = "data:image/png;base64,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"

/***/ }),

/***/ "./src/articles/tech/img/http2.jpg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/http2.084e5694.jpg";

/***/ }),

/***/ "./src/articles/tech/img/http3.jpg":
/***/ (function(module, exports) {

module.exports = "data:image/jpeg;base64,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"

/***/ }),

/***/ "./src/articles/tech/img/http4.jpg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/http4.740b44dd.jpg";

/***/ }),

/***/ "./src/articles/tech/img/http5.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/http5.609de935.png";

/***/ }),

/***/ "./src/articles/tech/img/mvc-2.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/mvc-2.3d2abf5c.png";

/***/ }),

/***/ "./src/articles/tech/img/standard-MVP.jpg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/standard-MVP.919384ed.jpg";

/***/ }),

/***/ "./src/articles/tech/img/standard-mvc.jpg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/standard-mvc.f3e75d89.jpg";

/***/ }),

/***/ "./src/articles/tech/img/tcp1.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp1.304602a0.png";

/***/ }),

/***/ "./src/articles/tech/img/tcp2.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp2.d95ecfa4.png";

/***/ }),

/***/ "./src/articles/tech/img/tcp3.jpeg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp3.fed6fad9.jpeg";

/***/ }),

/***/ "./src/articles/tech/img/tcp4.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp4.33c0948a.png";

/***/ }),

/***/ "./src/articles/tech/img/tcp5.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp5.7ee6ff71.png";

/***/ }),

/***/ "./src/articles/tech/img/tcp6.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp6.a2874c66.png";

/***/ }),

/***/ "./src/articles/tech/img/tcp7.jpg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp7.b322e11b.jpg";

/***/ }),

/***/ "./src/articles/tech/img/tcp8.png":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "media/tcp8.4d2e82cb.png";

/***/ }),

/***/ "./src/articles/tech/mvc_mvvm_mvp_flux.md":
/***/ (function(module, exports, __webpack_require__) {

module.exports = "<h1 id=\"mv与flux模式简析\">MV*与Flux模式简析</h1>\n<blockquote>\n<p>本文介绍并对比了 MVC、MVP、MVVM 几种框架模型，并以 Flux、React、Redux、Elm、Mbox、Reactive Programming 等举例分析其模型实质。</p>\n</blockquote>\n<h1 id=\"mvc\">MVC</h1>\n<p>对于 MVC 模型，一个重要的定义就是划分了三个模块：</p>\n<ul>\n<li>Model：负责管理应用的领域模型数据与行为</li>\n<li>View：代表Model的UI展示</li>\n<li>Controller： 接受用户输入，管理Model及View的更新</li>\n</ul>\n<p>但是三者是如何交互的，以及各自的依赖关系，并没有一个比较明确的定义，各个框架的实现都不尽相同。</p>\n<p>两种比较常见的描述如下：</p>\n<h4 id=\"1、controller-通知-view-更新\">1、Controller 通知 View 更新</h4>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/standard-mvc.jpg") + "\" width=\"800\"></p>\n<p>当用户操作 UI 界面时，Controller 负责响应用户事件，更新 Model并通知 View 更新，View 再从 Model 中 query 获取数据。</p>\n<h4 id=\"2、model-通知-view-更新\">2、Model 通知 View 更新</h4>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/mvc-2.png") + "\" alt=\"\"></p>\n<p>在这种定义中，数据流是单向的，同时 View 的更新是由 Model 控制的，不直接与 Controller 交互。</p>\n<p>无论三者如何交互，<strong>其依赖关系都是一致的，Controller 和 View 都依赖 Model，而 Model 对两者不感知。</strong>1和2的区别在于由谁来通知 View 更新，且1对于事件的定义更全面，不限于是用户通过 View 操作的事件，要知道，即使是 Web UI，也会有非用户行为事件，例如网络请求回调、URL地址变更等等。更大范围地看，server端的事件通常只有不同url的request请求，并根据请求操作数据，渲染不同的View。无论是哪种通知形式，MVC的目的都是让Model的变化可以及时反馈到 View 中。</p>\n<p>MVC中，controller 是有业务逻辑的，虽然我们强调&quot;fat model, skinny controller&quot;，但controller中还是有与业务相关的逻辑来决定将如何转发用户的请求，最典型的决定是转发到哪个Model层，比如路由。Model应该被更准确的称为Domain Model(领域模型)，它不代表具体的Class或者Object，也不是单纯的databse，而是一个“层”的概念：数据在Model里得到存储，Model提供方法操作数据(Model的行为)。所以Model代码可以有业务逻辑，甚至可以有数据的存储操作的底层服务代码。</p>\n<h1 id=\"mvp-和-mvvm\">MVP 和 MVVM</h1>\n<h2 id=\"mvp\">MVP</h2>\n<p>MVP 是 MVC 的变种，目的是为了更好地隔离 Model 和 View。在 MVP 中，Presenter 可以理解为松散的 Controller，包含了视图的 UI 业务逻辑，所有从视图发出的事件，都会通过代理给 Presenter 进行处理；同时，Presenter 也通过视图暴露的接口与其进行通信。Presenter 负责对模型的更新和读取，而 Model 改变时，可以将信息通知给 Observer Presenter。</p>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/standard-MVP.jpg") + "\" width=\"800\"></p>\n<p>假设 View 是完全被动的，并且不再根据模型来更新本身的内容，即被动示图（Passive View），那么View就不再依赖 Model，它的更新完全由 Presenter 来间接控制。因为视图层不依赖其他任何层级，也就最大化了视图层的可测试性，同时也将视图层和模型层进行了合理的分离，两者不再相互依赖。</p>\n<p>与被动视图中状态同步都需要显式的操作不同，监督控制器（Supervising Controller）就将部分需要显式同步的操作变成了隐式的：</p>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/Supervising-Controller.jpg") + "\" width=\"800\"></p>\n<p>视图层接管了一部分视图逻辑，主要内容就是同步简单的视图和模型的状态；而监督控制器就需要负责响应用户的输入以及一部分更加复杂的视图、模型状态同步工作。对于用户输入的处理，监督控制器的做法与标准 MVP 中的 Presenter 完全相同；但是对于视图、模型的同步工作，监督控制器会尽可能地将所有简单的属性以数据绑定的形式声明在视图层中。通过这种方式能够减轻监督控制器的负担，减少其中简单的代码，将一部分逻辑交由视图进行处理；这样也就导致了视图同时可以被 Presenter 和数据绑定两种方式更新，相比于被动视图，监督控制器的方式也降低了视图的可测试性和封装性。</p>\n<h2 id=\"presentation-model\">Presentation Model</h2>\n<p>Presentation Model（以下简称PM）与 MVP 比较相似，它从View层中分离了行为和状态，并创建了一个View的抽象，即 Presentation Model。</p>\n<p>PM 模式将视图中的全部状态和行为放到一个单独的展示模型PM中，协调领域对象（模型）并且为视图层提供一个接口。换言之，PM包含所有UI需要的数据和行为，但不包含实际渲染 UI 的逻辑。相应的，View 负责将 PM 的状态映射到实际的 UI 展示。</p>\n<p>PM 中应当包括需要展示的数据以及一些enable信息，比如一个输入框展示与否（isShowInput）取决与一个checkbox是否勾选（isCheckboxChecked），那么 PM 中就应当包含checkbox状态改变后同步修改 isShowInput 的逻辑。</p>\n<h3 id=\"状态同步\">状态同步</h3>\n<p>PM模式中，一个比较麻烦的点就是 PM 和 View 的状态同步。到目前为止，我们能够放置状态同步代码的地方其实只有两个，也就是视图和展示模型：如果将同步的代码放在视图中，那么可能会影响视图的测试；如果将代码放在展示模型中，实际上就为展示模型增加了视图的依赖，导致不同层级之间的耦合。同样以上面的例子解释，就是当View中的checkout的checked属性改变之后，是由View来调用PM的方法handleCheckboxChange之后紧接着将PM的PMState. isCheckboxChecked同步到ViewState. isCheckboxChecked，还是View 仅仅调用PM的handleCheckboxChange方法，而PM在这个方法的实现里将PMState. isCheckboxChecked同步到ViewState. isCheckboxChecked。</p>\n<p>显而易见，后者会使PM依赖View，不便于View的插件式更新。而引入PM的一个目的，通常是为了将同一PM应用与不同的View，所以会将同步逻辑放在View层级。</p>\n<p>MVC 与 MVP 的界限有时候会比较模糊，一个比较容易区分的方式，就是看 View 和 Model 之间是否是解耦的。如果是的话，通常来说更接近MVP模式。</p>\n<h3 id=\"pm-中各个模块的关系\">PM 中各个模块的关系</h3>\n<pre><code>View  - |                               | - Model\nView  - | - - - Presentation Model --- | - Model\nView  - |         \n\n</code></pre><p>在 PM 模式中，一个 PM 可以对应多个View也可以多个Model，但是一个View 只能有一个 PM。</p>\n<h1 id=\"mvvm\">MVVM</h1>\n<p>即Model-View-ViewModel。</p>\n<h3 id=\"mvvm-与-pm\">MVVM 与 PM</h3>\n<p>MVVM 架构模式是微软在 2005 年诞生的，实际上它就是基于 PM 的规范设计的。从 Model-View-ViewModel 这个名字来看，它由三个部分组成，也就是 Model、View 和 ViewModel；其中视图模型（ViewModel）其实就是 PM 模式中的展示模型，在 MVVM 中叫做视图模型。</p>\n<p>除了我们非常熟悉的 Model、View 和 ViewModel 这三个部分，在 MVVM 的实现中，还引入了隐式的一个 Binder 层，而声明式的数据和命令的绑定在 MVVM 模式中就是通过它完成的，这也是 MVVM 与 MVP 区别的关键，即在于 ViewModel 更新 View 的方式。MVVM的技术基础在于，需要有一套机制实现 View 和 ViewModel 的数据绑定，这意味着 ViewModel 上的变化会实时的体现到 View 的更新上，而 View 上的一些事件变化也会直接改变ViewModel 的值，MVVM 模式通过 ViewModel 和 View 的这种双向绑定的机制替代了 MVP 模式中P和V的手动桥接。在 ViewModel 和 Model 的关系上，和 Presenter 和 Model 的关系是类似的。</p>\n<h3 id=\"react-组件更新、react-hooks-与-mvvm-模式\">React 组件更新、React Hooks 与 MVVM 模式</h3>\n<p>以React 为例，虽然React 的定位是 View 层的框架，但个人认为，就组件的更新机制来说，也是一个类似MVVM的模式。</p>\n<p>组件的 props 对应model，将props 转换为 Child Components 或者 Virtual DOM 所需的 props 的逻辑部分对应 ViewModel（比如hooks）它可以有自己的内部状态即 state，而组件 render 或者 return 的 JSX 部分对应 View（也可以包括真实的 DOM）。而 react 组件实际上是使用了一个隐式的 binder 来实现 ViewModel 和 View 的同步—— 每次state变更都会导致组件重新渲染即rerender，从而更新 View（JSX中可能使用state变量）， 而 View 的更新比如用户事件会触发ViewModel中对应的 event handler，从而改变 ViewModel 的state值，再一次更新 View。 这么看起来，我们可以说 MVVM 将视图和展示模型之间的同步代码放到了视图层（JSX）中，也可以说通过隐式的方法实现了状态的同步。</p>\n<p>而对于有状态的组件来说， React Hooks 也是充当了 ViewModel 的角色。如果将有状态组件的 state 看作 Model，hooks 就有连接 Model 与 View 的作用。state 经过 hooks 处理（或透传）之后直接作为纯组件的props用于 View 的渲染，而 View 上的一些事件也会调用 hooks 方法改变 state，比如 useEffect 就可以在依赖数据变化时自动更新 Model。</p>\n<h3 id=\"reactive-programming-、rxjs-与-mvvm\">Reactive Programming 、RxJS 与 MVVM</h3>\n<p>说到 React Hooks 的 useEffect，咱们可以继续往下研究。useEffect 这种指定依赖数据，当依赖数据变化时自动执行函数的方式，实际上就形成了“观察者模式” —— Observer Pattern。而这种观察者模式，在响应式编程中运用得非常多。</p>\n<p>响应式编程中，everything is a stream，不论是网络请求返回的数据，还是用户点击事件，都可以看作是事件流。而stream之间是可以通过 observer 的方式，实现combine、propagate、filter等功能，即当有事件A发生的时候，可以自动同时执行事件B，事件B可以是过滤A的值，或映射成别的值。同时因为是“流”的操作，自然也会使用“迭代器模式” —— Iterator Pattern。这种编程模式，比较适合需要处理大量 event stream 的场景，同时，它的设计思想也是基于函数式编程，即开发者无须关心命令式的处理细节，也无须维护各自中间变量，只需要指定将事件流映射为其他结果流的方法，作用到每一个流中具体的事件即可。下面以 RxJS 为例，简单介绍一下响应式编程的具体实现。</p>\n<p>这个demo示意了一个列表+刷新按钮，通过请求API获取用户列表，同时点击刷新时可以更新列表。</p>\n<blockquote>\n<p>完整的demo及更多详情可参考<a href=\"https://gist.github.com/staltz/868e7e9bc2a7b8c1f754\" target=\"__blank\">此处</a>。</p>\n</blockquote>\n<pre><code>// 通过 Observable 创建可被监听的按钮的点击流\nvar refreshButton = document.querySelector(&#39;.refresh&#39;);\nvar refreshClickStream = Rx.Observable.fromEvent(refreshButton, &#39;click&#39;);\n\n// 将按钮的点击流映射成 API 请求地址的方法\nvar requestStream = refreshClickStream.startWith(&#39;startup click&#39;)\n  .map(function() {\n    var randomOffset = Math.floor(Math.random()*500);\n    return &#39;https://api.github.com/users?since=&#39; + randomOffset;\n  });\n\n// 将 API 请求地址流映射成 API 请求返回的方法\n// 注意这里创建responseStream的时候用到了 Promise，实际上 Promise 也就是 Observable\nvar responseStream = requestStream\n  .flatMap(function(requestUrl) {\n    return Rx.Observable.fromPromise(jQuery.getJSON(requestUrl));\n  });\n\n// 监听 API 请求返回，并执行对于操作\nresponseStream.subscribe(function(response) {\n  // render `response` to the DOM however you wish\n});\n\n</code></pre><p>如上述demo所示，当有新的点击事件发生时，refreshClickStream 会发生变化，从而触发requestStream变化，进而 responseStream 随之改变，最后触发 subscribe 里与更新 DOM 相关的逻辑执行。一气呵成！这样是不是也更函数式啦？只需要指定对事件流的响应方法，而无须命令式地根据事件手动调用相应的处理方法。</p>\n<p>这种模式，也类似 MVVM 。比如这个场景，API 请求的返回是 Model，这段代码对应的就是 ViewModel：responseStream.subscribe 的函数监听 Model 的改变，自动触发 View 更新；而当 View 上发生 click 事件的时候，自动触发 requestStream 、responseStream 变化从而更新 Model。</p>\n<h3 id=\"mobx-与-mvvm\">Mobx 与 MVVM</h3>\n<p>最后，再看看 Mbox 这种同样符合 MVVM 及运用了响应式编程理念的模式。</p>\n<p>看下官方的 tutorial 代码，实现一个 TODO list：</p>\n<blockquote>\n<p>完整的demo及更多详情可参考<a href=\"https://mobx.js.org/getting-started.html\" target=\"__blank\">此处</a>。</p>\n</blockquote>\n<p>首先，mobx 需要定义一个 class 形式的 store，封装数据与方法。其中 @observable 装饰器用来表示可以被监听变化的变量，与响应式编程中 observable 的概念一致。而 @computed 用来标识 derivation，即 observable 变量的衍生。 mobx.autorun 指定自动执行某个函数，当函数使用到的 observable 发生变化时，且具体到字段，比如demo中report函数只使用了todo.completed === false 的变量，所以修改某个未完成的todo变量时（比如todo.name === &#39;another one&#39;)，不会触发report执行。</p>\n<pre><code>class ObservableTodoStore {\n    @observable todos = [];\n        @observable pendingRequests = 0;\n\n    constructor() {\n        mobx.autorun(() =&gt; console.log(this.report));\n    }\n\n    @computed get completedTodosCount() {\n        return this.todos.filter(\n            todo =&gt; todo.completed === true\n        ).length;\n    }\n\n    @computed get report() {\n        if (this.todos.length === 0)\n            return &quot;&lt;none&gt;&quot;;\n        const nextTodo = this.todos.find(todo =&gt; todo.completed === false);\n        return `Next todo: &quot;${nextTodo ? nextTodo.task : &quot;&lt;none&gt;&quot;}&quot;. ` +\n            `Progress: ${this.completedTodosCount}/${this.todos.length}`;\n    }\n\n    addTodo(task) {\n        this.todos.push({\n            task: task,\n            completed: false,\n            assignee: null\n        });\n    }\n}\n\n\nconst observableTodoStore = new ObservableTodoStore();\n\n</code></pre><p>定义完store，我们再将其与 React 组件绑定起来。@observer 装饰器的作用在于，使 React 组件可以监听 store 的变化，当obervable变化时，自动更新对应的部分。</p>\n<pre><code>@observer\nclass TodoList extends React.Component {\n  render() {\n    const store = this.props.store;\n    return (\n      &lt;div&gt;\n        { store.report }\n        &lt;ul&gt;\n        { store.todos.map(\n          (todo, idx) =&gt; &lt;TodoView todo={ todo } key={ idx } /&gt;\n        ) }\n        &lt;/ul&gt;\n        { store.pendingRequests &gt; 0 ? &lt;marquee&gt;Loading...&lt;/marquee&gt; : null }\n        &lt;button onClick={ this.onNewTodo }&gt;New Todo&lt;/button&gt;\n        &lt;small&gt; (double-click a todo to edit)&lt;/small&gt;\n        &lt;RenderCounter /&gt;\n      &lt;/div&gt;\n    );\n  }\n\n  onNewTodo = () =&gt; {\n    this.props.store.addTodo(prompt(&#39;Enter a new todo:&#39;,&#39;coffee plz&#39;));\n  }\n}\n\n@observer\nclass TodoView extends React.Component {\n  render() {\n    const todo = this.props.todo;\n    return (\n      &lt;li onDoubleClick={ this.onRename }&gt;\n        &lt;input\n          type=&#39;checkbox&#39;\n          checked={ todo.completed }\n          onChange={ this.onToggleCompleted }\n        /&gt;\n        { todo.task }\n        { todo.assignee\n          ? &lt;small&gt;{ todo.assignee.name }&lt;/small&gt;\n          : null\n        }\n        &lt;RenderCounter /&gt;\n      &lt;/li&gt;\n    );\n  }\n\n  onToggleCompleted = () =&gt; {\n    const todo = this.props.todo;\n    todo.completed = !todo.completed;\n  }\n\n  onRename = () =&gt; {\n    const todo = this.props.todo;\n    todo.task = prompt(&#39;Task name&#39;, todo.task) || todo.task;\n  }\n}\n\nReactDOM.render(\n  &lt;TodoList store={ observableTodoStore } /&gt;,\n  document.getElementById(&#39;reactjs-app&#39;)\n);\n\n</code></pre><p>Mbox 的具体用法及概念我们在这里就不详述了，关键是看看它的设计思想。通过观察者模式的运用，mbox也算是借鉴了响应式编程的思想，但是mbox中的store并不是immutable的，是可以直接改变其字段值的，同时store的定义也是使用class来封装data和操作方法，这一点与函数式思想不符。而通过观察者模式，Model 更新自动触发 ViewModel 及 View 更新，同时View事件的响应函数在ViewModel层级上更新 Model，因此也可以说是符合   MVVM 模式的。</p>\n<h1 id=\"mvp-和-mvvm-模式的不足\">MVP 和 MVVM 模式的不足</h1>\n<p>以上所述，MVP 和 MVVM 是比较适合前端的设计模式，可以实现较好的 M 和 V 分离，但是仍然存在一些可以优化的地方：</p>\n<ol>\n<li><p>无法统一抽象前端中类型繁多的事件（比如非UI操作的网络请求回调、URL地址变更等）；</p>\n</li>\n<li><p>数据流在遇到级联更新时，会产生复杂的交错，难以定位问题根源。</p>\n</li>\n</ol>\n<p>针对问题2，我们来简单解释下。</p>\n<p>当有多个View 和 View Model存在时，可能会产生级联更新。比如如果用户操作了一个 View，View 通知 View Model，VM 更新Model，Model同步更新给所有观察者 VM，VM更新对应的View，另一个View又触发 View Model 更新......于是当Model的数据变更不符合预期时，就比较难快速定位更新的来源。</p>\n<p>在这个背景下，Flux就应运而生了。</p>\n<h1 id=\"flux\">Flux</h1>\n<p>关于Flux的基础概念我们就不具体展开了，其模式示意图如下：</p>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/flux.png") + "\" width=\"800\"></p>\n<p>Flux 是 Facebook 提出的一种前端架构，结合 ReactJS，可以很方便地实现一套数据的双向绑定，从而实现 MVVM 或 MVP。Flux 中的 store 对应 Model，View 不变（Flux中的view更加依赖React这种渲染机制），controller-views 类似 presenter，不过仅局限于 P 更新 V 的过程（类似上面提到的React组件props/state变化会自动rerender更新View的机制）。</p>\n<p>Flux 与 MVP 的不同之处在于，controller-views 只负责 Model 到 View 的桥接，即 View 的更新，而不会反向接受 View 的事件去更新 Model。所有 Model 的更新都是通过一个统一的 Dispatcher 接受 Actions，再调用注册或监听的 stores 的回调方法来更新对应数据，这一条路径，我理解其实 dispatcher就是一个 Controller，action用来统一各种事件，而 dispatcher 就是对事件的响应，并更新 Model。</p>\n<h3 id=\"elm-architecture\">Elm Architecture</h3>\n<p>Elm 是一种函数式的编程语言，可以用来开发网页或 web app，并能够编译成 JavaScript。</p>\n<p>官网的一个demo如下：</p>\n<pre><code>import Browser\nimport Html exposing (Html, button, div, text)\nimport Html.Events exposing (onClick)\n\nmain =\n  Browser.sandbox { init = 0, update = update, view = view }\n\ntype Msg = Increment | Decrement\n\nupdate msg model =\n  case msg of\n    Increment -&gt;\n      model + 1\n\n    Decrement -&gt;\n      model - 1\n\nview model =\n  div []\n    [ button [ onClick Decrement ] [ text &quot;-&quot; ]\n    , div [] [ text (String.fromInt model) ]\n    , button [ onClick Increment ] [ text &quot;+&quot; ]\n    ]\n\n</code></pre><p>在 Elm 语言中，天然实现了一种所谓的“Elm Architecture”，其原理大致如下图所示：\n<img src=\"" + __webpack_require__("./src/articles/tech/img/elm-pattern.png") + "\" alt=\"\"></p>\n<p>在 Elm Architecture 中，存在三个核心的概念：</p>\n<ul>\n<li>Model：app的state</li>\n<li>View：将state变为html</li>\n<li>Update：通过message来更新state</li>\n</ul>\n<p>简单来说，就是当用户操作 View 时，会通过回调函数触发 update，update 更新 model，model 变化引发 view更新，如上述demo代码所示，main就是将 view 与 update 绑定，同时 view 的定义也将 model 作为参数从而绑定。</p>\n<p>可以看出来，这种模式跟 Flux 其实有类似的地方，都是通过发送 message/action，然后通过 updater/dispatcher 的处理来更新 model。据 <a href=\"https://guide.elm-lang.org/architecture/\">Elm官方</a>说：</p>\n<blockquote>\n<p>In fact, projects like Redux have been inspired by The Elm Architecture, so you may have already seen derivatives of this pattern. </p>\n</blockquote>\n<h2 id=\"redux\">Redux</h2>\n<p>最后，我们看看 Redux，基于 Flux 规范的一种实现。  </p>\n<p>官方宣称的，基于 Flux 的单向数据流特性，以及三大原则，可以使state的变化变得可预测是怎么一回事呢？</p>\n<p>对比一下传统的 MVVM / MVP 模式，当应用涉及多个 Model &amp; View的时候，如果 View 改变引起其 Model 改变，Model 改变又 导致了另一个 Model 改变，从而导致另一个 View 改变，etc. 如此引发的级联更新会导致比较难定位变化的来源，以及难预测什么时候会发生变化。</p>\n<p>而 Redux，通过限制更新发生的时间和方式，即限制“并行修改state”与“可变化” 即immutable state，使得变化的回溯更容易。具体来说，代码不能直接修改state 也就是 Model 的值，而只能通过 dispatch 一个 action 来表达希望更改 state 的意愿。而action的处理也是串行的，处理完一个action的完整回路之后才会进入下一个action的处理。所谓的“单向数据流”，其实就是对比MVVM模式中，ViewModel 与 View 两个模块的双向交互，即 ViewModel 变更导致 View 更新，View 更新直接修改 ViewModel这种模式，Flux 是间接地通过 action 来代替后者，从而形成一个View 与 Model 之间的一个环路。</p>\n<p>同时，Redux 的设计要求state是 immutable 的，用来处理 action 的 reducer 也应该是纯函数。</p>\n<p>这样的机制有两个好处，首先，action的结构使得state的更新更易溯源，比较容易知道是因为什么原因要变更state的哪部分数据（想想看对比直接改state的某个字段值，哪个更直观），其次函数式特性及action的统一处理，避免了并行修改state可能导致的竞争，以及由此引入的难以复现的bug。</p>\n<p>除此之外，Redux 还建议整个app使用一个统一的immuatable store来记录状态，便于实现server直出及hydration，以及一些时间旅行相关的特性。</p>\n<p>但我理解，更广义地看，其实 action &amp; dispatcher 只是修改 Model 的更好的一种方式的规范，其实本质仍然跟 MVVM 没有区别。ViewModel其实就是集合了mapStateToProps及mapDispatchToProps这一层，前者使 Model更新时触发 View 更新，将领域模型转换为视图模型，供View层展示；后者则是对 View 事件的响应，发出修改 Model 的动作，而 reducer 则是将 actions 映射为对 Model 修改的细节，包含业务逻辑，可以算是领域模型层级的操作。</p>\n<h2 id=\"总结\">总结</h2>\n<p>本文大致介绍了几种常见的MV*模式，有些模式间的界限并不是特别清晰，比如 MVP 和 MVVM，有些模式也没有业界统一的定义，比如 MVC。不需要纠结某种实现属于什么模式，因为往往有可能并不严格属于某一种，有可能是几种的混合，或者有可能并没有严格准守某一种的规范。需要关注的是，当我们在设计或者实现一种模式时，要能清除地了解参与的各个模块的角色，划清职责，同时注意模块间的依赖关系与解耦，如此才能形成清晰的架构，易于维护与演进。</p>\n";

/***/ }),

/***/ "./src/articles/tech/oauth.md":
/***/ (function(module, exports) {

module.exports = "<h1 id=\"开放平台---getting-started-with-oauth-20-学习总结\">开放平台 - Getting Started with OAuth 2.0 学习总结</h1>\n<blockquote>\n<p>本文是OAuth 2.0的学习总结，主要是对Ryan Boyd的书《Getting Started with OAuth 2.0》重点内容进行翻译，并加上了自己的一些理解和总结。</p>\n</blockquote>\n<h2 id=\"背景及介绍\">背景及介绍</h2>\n<h3 id=\"oauth如何诞生\">OAuth如何诞生</h3>\n<p>最开始Google发布Google Calender的API时，它提供给开发者访问和管理用户谷歌日历的能力。然而，达到这个目的的唯一方式就是：用户提供他的谷歌账户用户名和密码，然后应用通过谷歌私有的ClientLogin协议（proprietary protocol）去获取和操作用户在谷歌的数据。不过这样的方式下，各种应用就会向用户索要他们的谷歌账户信息,以获取其数据。Flickr就是这样一个应用。后来Flickr被Yahoo！买了，就在Google收购Blogger的几年后。Yahoo！asking for谷歌用户密码的想法把双方都吓到了，于是就促使新的私有协议发展，来解决这个问题。使用用户名密码授权还有诸多问题，比如第三方应用拿到过多权限可能导致安全问题，或者用户如果改了密码，第三方就没权拿数据了。</p>\n<p>后来出现了新的协议，比如Google的AuthSub和Yahoo！的BBAuth，这种协议使得应用可以将用户重定向到数据提供者的授权页面，用户在这个页面下登录和授权，然后应用就可以拿到一个token，通过这个token去获取用户数据。</p>\n<p>这解决了部分安全问题，毕竟不是直接将用户信息提供给第三方应用。不过，这样的开发成本很高。开发者如果在应用中包含了多种主流的API，就需要分别去学习各种API的授权协议。特别是一个创业公司，觉得不划算，又不愿意自己搞一套，于是大家商量商量，一致同意搞一套标准出来。这么一来，既降低了各种API的接入成本，又保证了安全性！</p>\n<h3 id=\"几个重要概念\">几个重要概念</h3>\n<ul>\n<li>Authentication - 认证</li>\n</ul>\n<p>认证是为了确认你就是你所宣称的那个人。账号是你宣称的人，密码是证明你就是那个人。</p>\n<ul>\n<li>Federated Authentication - 联合认证</li>\n</ul>\n<p>大多数应用都有他们自己的账户体系，不过也有一些应用是依赖别的认证系统去识别用户的身份，这就叫做联合认证。在Web世界中，应用通常信任OpenID的提供商（比如Google和Yahoo！），让他们来进行用户身份验证。OpenID也是用于联合认证的最常用的web开放协议。</p>\n<ul>\n<li>Authorization - 授权</li>\n</ul>\n<p>授权是用来验证用户是否有权限去执行某个操作，比如读取某个文档或者access某个email账户。通常认证是在授权之前进行，以便确认用户身份正确。一般的做法是，web应用首先需要你登录来验证你的身份，然后给你一个每个操作对应的access control的列表，以确保你只调用你被允许使用的数据和服务。 \n* Delegated Authorization - 委托授权</p>\n<p>委托授权是指你允许第三方代表你去执行一些操作。比如你把钥匙给泊车小哥，让他帮你停车，并且不能干别的。OAuth类似，就是用户允许第三方应用代表他去执行一些用户允许的操作。</p>\n<ul>\n<li><p>Roles - 一些OAuth协议流程中的重要角色</p>\n<ul>\n<li>Resource server\n拥有用户资源的服务，一般是API的提供商。</li>\n<li>Resource owner\n应用的用户，有权管理他们在resource server上资源的使用权限。</li>\n<li>Client\n第三方应用，在获得resource owner允许的情况下可以代表他执行一些操作。</li>\n<li>Authorization server\n授权服务获取resource owner的同意并且传递access token给client以允许其获取resource server上的资源。</li>\n</ul>\n</li>\n</ul>\n<h3 id=\"关于signatures的争议\">关于signatures的争议</h3>\n<p>2007年OAuth 1.0刚出来时，要求每次API调用都要带上cryptographic signatures（加密签名），以便确保client的身份和权限。然而加密对于一般的开发者来说比较麻烦，这大大限制了OAuth的发展。后来，随着SSL/TLS的发展，API调用的安全性增强，signature也就不再那么必要了，取而代之的是bearer tokens的使用，这个token就代表了授权相关的信息。要不要取消这个签名一直存在争议，工程师们总是需要在安全性和易用性性之间平衡。取消了加密签名后，规范建议在实现OAuth 2.0，调用任何API或使用库时，我们都需要确保正确地进行了SSL/TLS证书链有效性验证，既要验证server返回的证书上的hostname跟请求的url是否一致，也要确保自己server所用证书授权的安全性。</p>\n<p>此外，如果API提供商支持或者要求加密，你可以参考MAC Access Authentication。简单来说就是每次authorization server都会返回一个access_token作为MAC key，然后client用它对http请求进行加密。</p>\n<h3 id=\"开发者及应用注册\">开发者及应用注册</h3>\n<p>尽管协议可以实现自动注册，大部分网站还是要求开发者在他们的开发者平台填一些信息后再注册。应用注册成功之后，会获得一个client id和一个client secret，后者在将authorization code转换为access token或者刷新access token时有用。</p>\n<h3 id=\"client-profiles-access-tokens和authorization-flows\">Client Profiles, Access Tokens和Authorization Flows</h3>\n<p>OAuth 1.0主要是针对传统的client-server web app设计的，对于其他场景（移动app，桌面app，浏览器插件等）的支持并不好。2.0 就在这方面做了改善。</p>\n<h4 id=\"client-profiles\">Client Profiles</h4>\n<p>2.0定义了许多重要的client profiles：</p>\n<ul>\n<li>Server-side web app</li>\n</ul>\n<p>在web server上运行的OAuth client，通过服务器端编程语言调用APIs。用户无权访问OAuth client secret或者任何access token。</p>\n<ul>\n<li>Client-side app running in a web browser</li>\n</ul>\n<p>在客户端运行的程序，比如js代码写的app或者浏览器插件，用户可以看到这类app的代码和API请求。这种情况下OAuth crendentials会被看做是不保密的，所以API提供商一般不会对这种client下发secret。</p>\n<ul>\n<li>Native application</li>\n</ul>\n<p>与上一类相似，也不会被发secret。</p>\n<h4 id=\"access-tokens\">Access Tokens</h4>\n<p>大多数基于OAuth 2.0的API都只需要bearer tokens来验证请求者身份。bearer tokens是一种access token，只需要有token值就可以访问私密的资源，而不需要其他加密key啥的了。</p>\n<p>获取到Access Token之后，将其加到API请求中去的方式有几种：1. 放到header里；2. 放到query string里；3. 放到form-encoded 的 body中。放头部的好处在于，header很少出现在代理服务器和访问日志的log中，且几乎不会被cache。放query利于debug，并且在client-side flow中有用。</p>\n<h4 id=\"authorization-flows\">Authorization Flows</h4>\n<p>任何类型的client都需要通过一个授权协议的流程来获取访问用户资源的权限。OAuth 2.0 协议定义了四种主要的“grant types”以及一种扩展机制。</p>\n<ul>\n<li>Authorization code</li>\n</ul>\n<p>这种授权模式非常适合server-side的应用。当用户同意授权之后，授权服务会验证用户是否处于active session，如果是，用户会被重定向回应用，并在url的query string中带有authorization code。然后client用这个code加上client secrte和client id去换access token，这是服务器之间的通信，对于用户不可见。同时使用refresh tokens的话，可保持long-lived access to an API。</p>\n<ul>\n<li>browser-based client-side applications的隐式授权</li>\n</ul>\n<p>这种授权方式是最简单的，也是对于客户端应用的优化。用户同意授权后，access token会以hash参数的形式返回，不需要中间层的authorization code，同样无法生成refresh token。</p>\n<ul>\n<li>通过用户的密码授权</li>\n</ul>\n<p>也就是说应用需要使用用户的账户名和密码去换authentication code。这只是在高度被信任的app上应用，比如API提供商自己开发的应用。应用不需要存储密码，只需要存储第一次授权后获取到的code，且用户不需要通过修改密码来取消授权。这种方式还是比传统的账户名密码认证要安全的。</p>\n<ul>\n<li>Client credentials</li>\n</ul>\n<p>Client credentials允许client获取用于访问client自己所有的资源的access token，或者当授权过程已经被一个授权服务器完成时。这种授权方式适用于应用需要以自己而不是用户身份来调用某些API时，比如存储服务和数据库。</p>\n<p>接下来我们就详细介绍这几种流程。</p>\n<h2 id=\"server-side-web-application-flow\">Server-Side Web Application Flow</h2>\n<p>又叫<strong>Authorization code flow</strong>。正如上面所说，由于access token从来没有在浏览器端传递过，而只是通过传递中间层的authentication code，所以保密性较好。然而，一些使用这种模式的应用会在本地保存一个refresh token，以便在难以与用户浏览器交互获取新access token时“离线”获取用户数据。这会造成安全隐患，尽管可以实现同时获取多个用户数据。</p>\n<p>授权流程图如下：\n<!-- ![](../../styles/img/oauth1.png) --></p>\n<h3 id=\"授权步骤\">授权步骤</h3>\n<h4 id=\"step-1-告诉用户你要干嘛并请求授权\">Step 1 告诉用户你要干嘛并请求授权</h4>\n<p>在这一步中，我们需要告诉用户接下来他们会被定向到授权页面。用户点击“去授权”后，会跳转到API提供商的OAuth授权页面或者在popup弹窗中展示。在这个页面，API供应商会展示出用户希望授权给第三方应用的权限列表，点击“确认授权”后会带着authorization code跳转会第三方应用。当然，用户需要登录了API提供商的服务，否则会先进入登录流程。一般API服务商的授权页面link都可在文档中找到，比如SPA Marketing API官网的就是https://developers.e.qq.com/oauth/authorize。</p>\n<h5 id=\"query-参数\">Query 参数</h5>\n<p>link中需要附上一些参数：</p>\n<ul>\n<li>client_id</li>\n</ul>\n<p>应用注册时得到的id。</p>\n<ul>\n<li>redirect_uri</li>\n</ul>\n<p>用户同意授权后跳转回的页面。通常也是在创建应用是注册的。</p>\n<ul>\n<li>scope</li>\n</ul>\n<p>第三方应用请求访问的数据。通常这是一个以空格分隔的字符串。有效的scope值应当在API文档中找到。比如MKT API中就分为了广告投放、账户管理、数据洞察、用户行为上报、人群管理等几个类。 </p>\n<ul>\n<li>response_type</li>\n</ul>\n<p>使用&#39;code&#39;值，用来表示用户同意授权后一个授权码会被返回。</p>\n<ul>\n<li>state</li>\n</ul>\n<p>一个你的第三方应用唯一的值，这个值在每次请求中都应当是一个随机字符串，不能泄露出去。这是用来防止CSRF攻击的。</p>\n<p>什么情况下会发生CSRF攻击呢？举个栗子。</p>\n<ol>\n<li>erra在第三方应用ilovedog.com上登录了，然后点击了绑定我的微信账号的授权链接；</li>\n<li>erra被重定向到微信的授权页面xxx.weixin.com/auth，在这个页面erra完成了微信登录；</li>\n<li>登录完成后，erra访问的页面又跳转回ilovedog.com，并且带上了授权码：ilovedog.com/code=erracode</li>\n<li>突然，erra在这里停住了，没有继续往下走，并且把第3步中的url发给了selina；</li>\n<li>selina也登录了ilovedog.com，并且点击了ilovedog.com/code=erracode，此时ilovedog.com服务会拿代表erra身份的erracode去换access token，这么一来，selina在ilovedog.com上就绑定了erra的微信。如果她通过微信分享ilovedog.com中的照片到朋友圈，就会发到erra的微信朋友圈中了。或者，如果是授权微信登录，erra就可以用自己的微信登录selina的ilovedog网了。</li>\n</ol>\n<p>很可怕是不是，所以state参数还是很有必要的。</p>\n<h5 id=\"错误处理\">错误处理</h5>\n<p>当query参数中有的值无效时，比如client_id或者redirect_uri，authentication server应当给出错误提示，并且不要重定向回client。当用户或者authentication server拒绝授权时，应当重定向回第三方应用，并带上error参数指明错误类型，比如access_denied。除此之外，还可以附上更详细的错误信息，例如error_description或者error_uri指向一个详细说明错误原因的页面。</p>\n<p>其他OAuth 2.0 标准中规定的错误类型：</p>\n<ul>\n<li><strong>invalid_request</strong>: 缺少参数、含不支持的参数、参数格式不对</li>\n<li><strong>unauthorized_client</strong>: client没有使用这种方式获取授权码的权限</li>\n<li><strong>unsupported_response_type</strong>: authentication server不支持通过这种方式获取授权码</li>\n<li><strong>invalid_scope</strong>: scope值无效、缺少或格式不对</li>\n<li><strong>server_error</strong>: 授权服务器出现错误</li>\n<li><strong>temporarily_unavailable</strong>: 授权服务器暂时不可以用</li>\n</ul>\n<h4 id=\"step-2-用authentication-code换access-token\">Step 2 用authentication code换access token</h4>\n<p>如果没有错误发生，在用户授权后，会被重定向到redirect_uri并带上code和state两个参数。接下来，如果state检查ok，第三方应用需要用这个code区换access token。</p>\n<p>在不借助第三方库的情况下，第三方应用需要向授权服务器发一个POST请求，并带上参数code、redirect_uri、grant_type（字符串&quot;authorization_code&quot;, 代表要用code换access token）。此外，这个POST请求是需要进行身份认证的，认证方式有两种，一种是把client_id和client_secret分别作为username和password放到authorization header中；另一种是作为字段添加到POST请求参数中。</p>\n<p>如果身份验证和参数检查都成功，就会返回一个JSON格式的response，并带有参数：</p>\n<p>-<strong>access_token</strong>: 可用来调用API的token\n-<strong>token_type</strong>: 通常为“bearer”\n-<strong>expires_in</strong>: access token的剩余有效时间，秒为单位\n-<strong>refresh_token</strong>: 一个当access token过期后可以用来重新获取的token。一般在server侧与用户身份信息对应存储，就避免每次access_token过期后都需要用户重新授权。</p>\n<p>access_token有效时间短，一方面降低了黑客拿到明文token后操作用户数据的风险，另一方面有利于在用户取消授权后，快速废弃第三方应用的代理操作权限。</p>\n<h4 id=\"step-3-调用api\">Step 3 调用API</h4>\n<p>得到access_token之后，我们只需要将他放入请求中，就可以调用API了。最好是按上述说的，放在Authorization header中。</p>\n<h5 id=\"错误处理-1\">错误处理</h5>\n<p>遇到调用错误，例如token过期、授权失效时，会得到一个HTTP 4XX的错误。规范规定返回头中应有WWW-Authenticate字段，指明失败的原因。当然有些API供应商会返回JSON格式的错误信息数据。</p>\n<h4 id=\"step4-更新access_token\">Step4 更新access_token</h4>\n<p>为了提高应有性能，最好同时存储access_token和expire_in两个值。在调用API之前，先检查access_token是否过期。更新需要发一个POST请求，带上grant_type（值为‘refresh_token’）和refresh_token两个值。成功后，不仅会返回新的access_token，也会有新的refresh_token。</p>\n<p>对于一些“online”的应用，他们并不想获取refresh_token，而是当access_token过期时又开始一个authorization flow，不过只要user之前授权过，这次就不需要user同意，会自动将其重定向回应用并获取授权码。</p>\n<h4 id=\"解除授权\">解除授权</h4>\n<p>大部分API供应商都允许user手动解除授权，不过这种情况下应用通常不会得到通知，只有在下次调用是出错才知道。Facebook会在user解除授权时，向应用发一个POST请求。</p>\n<p>此外，一些授权服务同样支持通过程序解除授权。当应用不想管了一些无用的权限时，比如用户卸载了应用，就可以通过发请求到授权服务器使token失效。这是在OAuth 2.0规范的扩展草案中提出的。</p>\n<h2 id=\"client-side-web-application-flow\">Client-Side Web Application Flow</h2>\n<p>客户端的web应用授权过程比较简单，当用户同意授权时，会直接返回access token，而不像服务端的应用授权一样需要一个授权码。</p>\n<h3 id=\"适用场景\">适用场景</h3>\n<ul>\n<li>只需要对数据暂时的访问权限</li>\n<li>用户会定期登录API Provider</li>\n<li>OAuth client在浏览器运行（通过JS,Flash等编写的）</li>\n<li>浏览器是非常值得信任的，几乎不担心access会被泄露</li>\n</ul>\n<!-- ![](../../styles/img/oauth2.png) -->\n<h3 id=\"授权步骤-1\">授权步骤</h3>\n<h4 id=\"step-1-告诉用户你要干嘛并请求授权-1\">Step 1 告诉用户你要干嘛并请求授权</h4>\n<p>这一步与服务端应用授权类似，同样需要在请求授权url时带上client_id, redirect_uri, response_type(&#39;token&#39;), state, scope参数。错误处理也类似，不重复了。</p>\n<h4 id=\"step-2-从url中获取access-token\">Step 2 从URL中获取access token</h4>\n<p>当用户同意授权后，会被重定向会第三方应用，并以hash值的形式带上acees token，比如ilovedogs.com#access_token=shdjue678dysugfjhsw&amp;token_type=Bearer&amp;expires_in=3600。这样一来应用就可以直接取到access_token啦。</p>\n<h4 id=\"step-3-调用api-1\">Step 3 调用API</h4>\n<p>有了access_token之后，就可以愉快地调用被授权的API了。不过因为是从客户端发起请求，涉及到跨域的问题，可以用JSONP解决。</p>\n<h4 id=\"step4-更新access-token\">Step4 更新access token</h4>\n<p>这种隐式授权方式的限制是，不提供refresh token。所以每次access token过期后，都需要重新走一遍流程。这也使得安全性有所提高。不过有些API供应商比如Google允许当用户授权过一次时，之后可以跳过请求用户授权的步骤而自动授权。如此一来，就可以在需要更新access token时，在一个隐藏的iframe中进行，提升用户体验。有一种还没写入规范的“immediate”mode，就允许这么做，并且在用户被定向到授权页面时立即将其重定向回应用，同时打印出自动授权失败的错误。</p>\n<h3 id=\"解除授权-1\">解除授权</h3>\n<p>与服务端应用授权类似。</p>\n<h2 id=\"resource-owner-password-flow\">Resource Owner Password Flow</h2>\n<!-- ![](../../styles/img/oauth3.png) -->\n<p>这种方式是用用户的账号和密码去换取access token，因此安全性与之前两种方式相比较低，需要第三方应用是完全可信任的。</p>\n<h3 id=\"适用场景-1\">适用场景</h3>\n<p>这种模式一般只使用与第三方应用是API供应商官方出品的情况下。同时为了避免被钓鱼，开发者和IT管理者需要明确告诉用户如何分辨是否是真正的官方应用。</p>\n<p>虽然安全性不高，但这种方式相较于直接用账号、密码作为身份信息去调用API要好。一是应用只需要使用一次账号、密码信息去换access token，因此没必要保存、二是用户不需通过改密码的方式解除授权，更方便。</p>\n<h3 id=\"授权步骤-2\">授权步骤</h3>\n<h4 id=\"step-1-请求用户的账号信息\">Step 1 请求用户的账号信息</h4>\n<p>第一步就是请求用户输入账号和密码。通常，当用户是从一个不受信任的网络登录时，应用还会要求用户输入一个security token，就像登录网银时需要输入的令牌，以验证登陆者的身份。</p>\n<h4 id=\"step-2-交换access-token\">Step 2 交换access token</h4>\n<p>这一步与用授权码交换access token很类似，只需要发一个POST请求，并提供账号信息和client_id即可。需要提供的参数：</p>\n<ul>\n<li>grant_type: 使用值&#39;password&#39;</li>\n<li>scope（可选）</li>\n<li>client_id（可选）</li>\n<li>client_secret（可选）</li>\n<li>username: 用户在API供应商的账号</li>\n<li>password: 用户在API供应商的密码，可能需要与security token串联作为值</li>\n</ul>\n<p>如果授权成功，会返回access_token。</p>\n<h4 id=\"step-3-调用api-2\">Step 3 调用API</h4>\n<p>与其他模式类似。</p>\n<h4 id=\"step4-更新access-token-1\">Step4 更新access token</h4>\n<p>规范建议API提供商提供一种更新短有效期的access token的机制，这样可以避免应用存储用户的账户信息，这也是与传统验证相比的优势。</p>\n<h2 id=\"client-credentials-flow\">Client Credentials Flow</h2>\n<p>这种模式下，client只需要提供自己的client账户信息，就可以换取access token，而不需要用户的授权。比如在client自己拥有这些数据（例如调用API提供商的云存储服务），或者用户已经通过常规认证流程之外的方式授权过的情况下。甚至都不需要发任何token，只需要看请求API的client是否有权限就行。</p>\n<p>这种模式下，需要保证client的账户信息高度保密。client即可以通过在POST请求中添加账户信息来进行身份验证，也可通过公钥、私钥或者SSL/TLS的方式在authorization server进行身份验证。\n<!-- ![](../../styles/img/oauth4.png) --></p>\n<h3 id=\"授权步骤-3\">授权步骤</h3>\n<p>与其他步骤类似，只是第一步中需要传递grant_type（值为&quot;client_credentials&quot;）、client_id、client_secret作为参数换取access token。同时，这种模式下的access token通常是长期有效的，且不提供refresh token。</p>\n<h2 id=\"移动应用的授权\">移动应用的授权</h2>\n<p>移动应用分为两种，一种是基于HTML5和其他web技术的移动应用，另一种是原生的移动应用。前者可以使用一般的web授权方式，后者就需要额外的方式了。</p>\n<h3 id=\"适用场景-2\">适用场景</h3>\n<p>当移动应用有后台服务器时，我们可以用任何一种典型的web应用授权方式。如果需要长期授权，就用服务端应用授权方式；如果只需要短期授权或者一次性授权，就用客户端授权方式。</p>\n<p>如果第三方应用没有后台服务器，我们就需要使用native app flow了。这种授权方式与服务端应用授权和客户端应用授权类似，不过有两个限制条件：一是没有web服务器用来接收redirect_uri跳转，另一个是需要保证client_secret的保密性。</p>\n<p>根据应用平台和API提供商规定，我们可以使用类似my-mobile-app://oauth/callback这样的url作为redirect_uri的值。然而，这样的自定义uri通常很难保证唯一性，就可能造成跳到别的app里了。另一种可能是API提供商根本就不允许用这种自定义url作为回调。</p>\n<p>在native app flow中，redirect_uri会是一个特殊的值，用来将用户定向到authorization server的一个web页面。在这个页面上，用户可以获得authorization code或者access token，再通过粘贴复制的方式输入到移动应用中，或者移动应用通过程序获取window title或者body中对应的值。</p>\n<h3 id=\"丑陋的web浏览器\">丑陋的web浏览器</h3>\n<p>阻碍原生应用接入OAuth授权的一个原因是，通常需要在应用中嵌入WebView或者调用手机系统的浏览器。</p>\n<p>使用嵌入的WebView是一个比较常见的做法，因为不需要进行上下文切换，且应用可以对浏览器有较高的控制权，比如从其中取cookie或window的title。劣势是WebView通常不显示“可信任”网站标识，也不显示url，用户容易被钓鱼；并且WebView的cookie和history是独立的，这意味着用户每次授权都需要重新登录API提供商的账户。</p>\n<p>使用系统自带的浏览器也有好有坏，好处是用户通常不需要重新登录API提供者账户，且安全性更高；坏处是用户在浏览器认证完成后需要通过my-mobile-app://oauth/callback这样的链接跳转回应用，如上所述，有可能跳到别的别有用心的应用里；并且系统浏览器的历史记录是不受应用控制的，在使用隐式授权方式时容易泄露token，特别是移动设备容易丢失和被盗的情况下。</p>\n<p>一些API提供商提供了对于原生应用授权的友好支持，比如Facebook就提供了安卓和iOS的SDK用于用户授权。在安卓系统中，可以调用Facebook.authorize()来呼起授权请求，用户同意后，再调用Facebook.getAccessToken()获取调用对应API的access token。</p>\n<h2 id=\"openid-connect认证\">OpenID Connect认证</h2>\n<h3 id=\"背景\">背景</h3>\n<p>几乎所有应用都会要求用户创建一个账户用于登录。然而注册过程通常比较繁琐，用户又经常会用同一个密码注册不同账户，账户安全容易受到威胁。OpenID就是为了实现用一个身份登录不同的应用。使用OpenID时，用户和应用都是信任身份提供者的（比如Google、Facebook），允许他们存储用户资料并代表应用验证用户身份。这种机制不仅免除了应用自建一套账户体系的麻烦，还方便了用户登录和使用各种应用。</p>\n<h3 id=\"openid-connect\">OpenID Connect</h3>\n<p>OpenID Connect是OpenID的下一代，它包含了以下两个考虑：\n1. 允许访问用户身份信息与允许访问用户数据类似，开发者不需要针对这两种场景使用不同的协议；\n2. 规范应当与是模块化的 —— 兼容上一个OpenID版本，包括automated discovery, associations等特性。</p>\n<h2 id=\"id-token\">ID Token</h2>\n<p>ID Token代表一个已经被授权的用户信息，在授权流程中用来查询用户资料或者其他用户数据。这个ID是一个JSON Web Token，通常代表被签名或/和加密过的用户身份信息。相比与通过加密方式验证其有效性，将其作为一个非直接的key传送给Check ID服务来解释更符合OAuth 2.0的特性，也是其相比与之前的版本的优势所在。</p>\n<h2 id=\"安全问题\">安全问题</h2>\n<p>虽然认证流程与OAuth的授权流程类似，但其所面临的安全问题却是不同的，比如说重放攻击（Replay attacks）：</p>\n<ul>\n<li>攻击者拿到用户的登录一个站点的保密信息后，重新登录相同的站点；</li>\n<li>别有用心的开发者拿到用户信息后，假装用户身份登录另一个应用。</li>\n</ul>\n<p>针对第一种攻击，OAuth 2.0 要求使用SSL/TLS阻止消息泄露。针对第二种攻击，需要OpenID Connect提供一种特别的解决方法，就是使用Check ID endpoint。该终端用来验证OAuth provider提供的用户身份信息给了正确的应用。</p>\n<p>如果应用使用的是服务端应用授权方式，那么浏览器只会收到一个auth code，然后再由服务器去换access token和identity token。因为需要提供相应的client id和secret，自然可以避免使用发给另外一个app的authorization code的问题。</p>\n<p>如果应用使用的是客户端授权方式，那么access token和identity token就会直接发给浏览器。通常浏览器会将其发回后端服务器以验证这个登录用户的身份，这种情况下，服务器就必须通过解密ID Token或者请求Check ID endpoint的方式来验证了此身份信息是否发给正确应用了。这叫做“verifying the audience” of the token。</p>\n<h2 id=\"获取用户授权\">获取用户授权</h2>\n<p>通过OpenID Connect认证用户的过程与用OAuth 2.0 获取任何API授权的过程几乎一致。既可以使用服务端方式，也可以使用客户端方式。不论使用哪种方式，应用都会将用户定向到Auth提供商的授权页面，并带上如下参数：</p>\n<ul>\n<li>client_id</li>\n<li>redirect_uri</li>\n<li>scope：基础的OpenID Connect请求是“openid”，如果需要别的信息需指明，如email、address等</li>\n<li>response_type：使用值&#39;id_token&#39;表示需要Auth服务返回一个id_token，此外需同时提供“token”或“code”</li>\n<li>nonce：一个随机字符串，用来防止重放和CSRF攻击，在ID token请求返回中也会原样返回</li>\n</ul>\n<p>用户同意授权后，会被重定向到redirect_uri，同时返回access token（用于请求UserInfo Endpoint获取用户资料）和id_token（用于请求Check ID Endpoint获取用户身份信息）。</p>\n<h2 id=\"check-id-endpoint\">Check ID Endpoint</h2>\n<p>Check ID Endpoint是用来验证id_token的有效性，以确保它是给某一个应用使用的，同时用于client开始一个已认证身份的session。正如上面所说，当使用客户端授权时这个验证是十分必要的，避免重放攻击。如果没有错误，会返回参数：</p>\n<ul>\n<li>iss：user_id有效的域名</li>\n<li>user_id：代表iss域名下已认证的用户的身份的值</li>\n<li>aud：需要验证这个值是否和获取id_token的请求中所用的client_id相同</li>\n<li>expires_in：有效时间</li>\n<li>nonce：同样需要验证是否和获取id_token的请求中所用的值相同</li>\n</ul>\n<h2 id=\"userinfo-endpoint\">UserInfo Endpoint</h2>\n<p>Check ID Endpoint只会返回一个user_id，如果需要更多用户信息，就需要请求UserIndo Endpoint了。UserInfo Endpoint是一个标准的OAuth-授权 REST API。与别的API调用一样，可以将access token放在Authorization Header中。请求成功后，会以JSON格式返回用户的资料。</p>\n";

/***/ }),

/***/ "./src/articles/tech/program_languages_features.md":
/***/ (function(module, exports) {

module.exports = "<h1 id=\"从js的三个特性谈计算机语言发展\">从JS的三个特性谈计算机语言发展</h1>\n<blockquote>\n<p>JavaScript 语言是一门“面向对象”、“函数式编程”的“动态”语言。本文就基于这三个特性出发，介绍了语言发展的历程，希望帮助读者对不同的计算机语言有更系统的认识。</p>\n</blockquote>\n<h3 id=\"语言发展\">语言发展</h3>\n<p>计算机程序设计语言，经历了机器语言、汇编语言、高级语言三个过程。</p>\n<h4 id=\"机器语言\">机器语言</h4>\n<p>机器语言是指一台计算机全部的指令集合。二进制是计算机语言的基础，也是机器唯一能理解并执行的语言。其程序就是一个个二进制文件。由于不同计算机的指令系统通常不同，所以需要针对不同型号的计算机编写不同的程序，工作量非常大，且极难调试。但是这种语言运行效率最高。</p>\n<h4 id=\"汇编语言\">汇编语言</h4>\n<p>汇编语言将一个特定指令的二进制串比如加法用简洁的人能读懂的形式表示，如“ADD”。但计算机是不懂的，需要通过汇编程序将其编译成机器语言再执行。汇编语言仍与硬件强关联，移植性差，但效率仍然很高。</p>\n<h4 id=\"高级语言\">高级语言</h4>\n<p>早期计算机发展时，人们意识到应该设计一种接近于数学语言或人类语言，同时又不依赖机器硬件的语言，编出的程序能在所有机器上通用。高级语言源代码通常需要被编译／解释之后才能运行。</p>\n<p>第一个高级语言是 Fortran。之后，高级语言经历了从早期语言到结构化程序设计语言，从面向过程到非面向过程的发展。</p>\n<h5 id=\"结构化程序语言\">结构化程序语言</h5>\n<p>结构化程序语言诞生的背景是软件生产缺乏科学规范的系统规划与测试、评估标准，即系统不可靠。人们意识到，应该像处理工程一样处理软件研制全过程，且程序设计应该易于保证正确性，便于验证，70年第一个结构化程序设计语言——Pascal便出现了。</p>\n<h5 id=\"非面向过程语言\">非面向过程语言</h5>\n<p>80年代初期开始，在软件设计思想上，又出现了面向对象的程序设计。在此之前，所有高级语言几乎都是面向过程的，程序流水线般执行。这于人们习惯的，针对功能处理事务不相符，应当是面向具体的应用功能，也就是对象来编程。如同集成电路一样，制造一些通用的、封装的功能模块，且无须关注其实现细节，只关注接口，需要时就调用。</p>\n<p>除了<strong>面向对象</strong>，<strong>函数式</strong>编程也是一种非面向过程的编程思想。我们将在下文中介绍函数式编程。</p>\n<p>发展的下一个阶段是，你只需要告诉程序你要干什么，程序就能自动生成算法、自动处理，这就是非面向过程编程。</p>\n<h5 id=\"脚本语言\">脚本语言</h5>\n<p>传统的高级语言源代码，需要经历“编写-编译-链接-运行（edit-compile-link-run）”过程才能被执行，而脚本语言，或称动态语言，是为了缩短传统过程而创建的计算机编程语言。</p>\n<p>通常来讲，<strong>脚本语言</strong>是<strong>解释</strong>运行而非编译，由解释器根据定义好的规则“解释”代码语句，并做出相应的反应。它不象c\\c++等可以编译成二进制代码,以可执行文件的形式存在，脚本语言不需要编译，可以直接用，由解释器来负责解释。与传统编译语言的区别主要在于，脚本语言是运行时才解释的。</p>\n<h2 id=\"几种语言特性\">几种语言特性</h2>\n<h3 id=\"编译型、解释型语言\">编译型、解释型语言</h3>\n<p><strong>编译型</strong>语言是指，一段程序源代码需要先编译成机器可执行的机器指令（二进制）后，再由机器运行。例如C、C++。关键在于一次性翻译，并且会生成目标代码（机器可执行代码）。</p>\n<p><strong>解释型</strong>语言是指，程序源代码不是直接翻译成机器指令，而是先翻译成中间代码，再由解释器对中间代码进行运行时的解释，之后用一个执行环境读入并执行解释后的代码。例如JavaScript、PHP。其关键在于每句每句地解释并执行，如果有循环体，比如10次，那么语句就要被解释执行10次，整个过程不会产生目标代码。</p>\n<p>编译型代码是一次性将代码编译成机器可执行的二进制文件，以后再运行就不需要翻译了，效率比较高。但是针对不同的“机器”，可以执行的指令类型不尽一致，所以跨平台能力较弱。</p>\n<p>解释型代码每次运行时都需要重新“解释”成机器可执行的代码，效率会低些，但是其跨平台能力更强（当然需要安装解释器）。</p>\n<p><strong>扩展</strong>\n当然在一些语言中，这两种特性会同时存在，例如 JVM（java 虚拟机）的 JIT（Just in time）机制。</p>\n<p>JVM 有两种执行方式：解释执行和编译执行。</p>\n<p>解释执行是将字节码(.class文件)在运行时解释，生成机器码运行。编译执行则是不加筛选的将全部代码进行编译机器码，不论其执行频率是否有编译价值。通常，JVM 会采取混合模式，即 JIT，它会将热点代码（如循环体内代码）翻译成机器码缓存，其他代码则采用运行时解释的方式，来提高程序执行效率。</p>\n<p><strong>JavaScript</strong>解析引擎就是能够“读懂”JS代码，并准确给出运行结果的一段程序。比如浏览器的console就是一个解释引擎。但是现在也比较难界定js的解析引擎究竟是解析器还是编译器，比如 Google 的 V8 引擎为了提高JS运行的性能，会在执行前先将源码编译成机器码，再由机器执行。这里的分类就比较不明确了，V8 引擎在运行时解释，这一点符合解释器的特性，将所有代码翻译成机器语言，这又符合编译器的特性。</p>\n<h3 id=\"动态、静态类型语言\">动态、静态类型语言</h3>\n<p><strong>静态类型语言</strong>是指数据类型的检查是在运行前（如编译阶段）进行的。例如C++。</p>\n<p><strong>动态类型语言</strong>是指数据类型的检查是在运行时做的。用动态类型语言编程时，不用给变量指定数据类型，该语言会在你第一次赋值给变量时，在内部记录数据类型。例如JS。</p>\n<h3 id=\"动态语言、静态语言\">动态语言、静态语言</h3>\n<p>通常来讲，动态语言就是指脚本语言，比如 JavaScript。那么，它的动态性体现在哪里呢？总结来说，就是在运行时可以改变其结构。</p>\n<p>动态是指在语言陈述时无法确定，必须在计算机执行时才能确定程序结果的特性。JS 可以随意改变对象的属性（增加、删除属性），可以通过eval函数改变当前作用域下变量的值，可以通过bind、apply改变上下文即this的值，这些在静态语言例如C++中都是没有的，C++的类结构一旦定义好了就不能随意改变，通常this的指向也是固定的。</p>\n<h3 id=\"函数式编程\">函数式编程</h3>\n<p>面向对象编程，是将数据进行封装；函数式编程，可以看做是对过程的封装。其中一个重要的运用，是纯函数，即输入一定时，输出也一定的无副作用的函数。将函数看作和普通类型一样，可以对它赋值、存储、作为参数传递甚至作为返回值返回，这种思想是函数式编程中最重要的宗旨之一。</p>\n<p>函数式编程的特点：</p>\n<ol>\n<li><p>函数定义：函数要有输入、输出；</p>\n</li>\n<li><p>无副作用：使用纯函数，同时纯函数中不应有“变量”的概念，同样不存在“赋值”一说，只能使用“常量”；</p>\n</li>\n<li><p>高阶函数：即函数为一等公民，与普通变量一致；</p>\n</li>\n<li><p>柯里化：函数式编程中，可以将包含了多个参数的函数转换为一个参数的函数，通过多次调用来实现目的。示例如下：</p>\n<pre><code>function add = (x,y) =&gt; x + y;\nconst sum = add(1,2) // 3\n\n// 可以转换成\nfunction add = x =&gt; {\n    return y =&gt; x + y;\n}\nconst sum = add(1)(2) // 3\n\n</code></pre><p>这里的加法过程比较简单，看上去这么转换意义不大。但是对于一个比较复杂的过程来说，将其计算过程简单化，再通过多次调用简单化的函数来实现，对于开发者来说会更友好。再比如 JS 中 Array 的map方法，开发者只需传入一个函数（对于处理过程的封装），所有数组中元素都会依次调用这个函数，并返回处理后的新数组。如果map方法的实现不使用函数式编程的思想，那么每种对于数组数据的处理方式，都需要写成一个函数（参数是数组），就不友好了。</p>\n<p>map方法只是封装了对数组的循环操作，对于每个元素如何操作，由开发者自行决定（传入函数），这就是函数式编程的思想。</p>\n</li>\n</ol>\n<p>看完这些，如果你是一个前端开发，对于“JavaScript 是一门面向对象的、函数式编程的、动态语言”这样的定义，应该有更深刻的了解了吧 ；）</p>\n";

/***/ }),

/***/ "./src/articles/tech/tcp.md":
/***/ (function(module, exports, __webpack_require__) {

module.exports = "<h1 id=\"tcp协议介绍\">TCP协议介绍</h1>\n<blockquote>\n<p>本文介绍了 TCP 这一面向连接、可靠的、基于字节流的运输层协议，通过对协议头、通信过程中的三次握手和四次挥手过程的详细介绍，说明了这三个特性各自的实现方式及意义。最后，还与非连接的 UDP 协议做了对比。通过阅读此文，相信您可以对TCP协议有比较全面的认识。</p>\n</blockquote>\n<h2 id=\"协议分层\">协议分层</h2>\n<p>参考模型：</p>\n<pre><code>| 应用层 （如HTTP、FTP、TELNET）|\n|---------------------------------|\n| 运输层 （TCP或UDP） |\n| 网络层 （IP） |\n| 网络接口层 （如Ethernet）|\n\n\n</code></pre><h2 id=\"tcp-协议\">TCP 协议</h2>\n<p>TCP （Transmission Control Protocol，传输控制协议） 是一种<strong>面向连接的、可靠的、基于字节流</strong>的传输协议，那么它的具体协议内容及通信机制是怎样的呢？</p>\n<h3 id=\"与前两层协议的关系\">与前两层协议的关系</h3>\n<h5 id=\"网络接口层\">网络接口层</h5>\n<p>负责接收IP数据并通过网络发送，或者从网络上接收物理帧，抽出IP数据报，交给IP层。</p>\n<p>比如以太网（Ethernet）协议，规定了电子信号如何组成数据包（package），解决了<strong>子网内的点对点通信</strong>。例如总线型，star型，ring型等。</p>\n<h5 id=\"网络层\">网络层</h5>\n<p>负责相邻计算机之间的通信。其功能包括：</p>\n<ol>\n<li>处理来自传输层的分组发送请求，收到请求后，将分组放入IP数据报，填充报头，选择去往信宿机的路径，然后将数据报发往适当的网络接口；</li>\n<li>处理输入的数据报：检查其合法性，然后寻径——如果已到达信宿机，则去掉报头，将剩下部分交给适当的传输协议；如果尚未到达，则转发该数据报；</li>\n<li>处理路径、流控、拥塞等问题。</li>\n</ol>\n<p>比如IP协议，解决<strong>多个局域网互通</strong>的问题。它定义了一套自己的地址规则，称为IP地址，基于此实现路由功能。</p>\n<h5 id=\"传输层\">传输层</h5>\n<p>提供应用程序间的通信，比如浏览器和和网络软件。其功能包括：</p>\n<ol>\n<li>格式化数据流；</li>\n<li>提供可靠传输。</li>\n</ol>\n<p>IP协议只是一个地址协议，并不保证数据包的完整性，而 TCP 协议的功能就是<strong>保证通信的完整性和可靠性</strong>。</p>\n<p>以上三层协议关系的示例如下：</p>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/tcp8.png") + "\" alt=\"\">\n以太网数据包的大小是固定的（1522字节），但各种协议头都需要占用字节，所以TCP实际负载在1400字节左右。</p>\n<h3 id=\"基于字节流\">基于字节流</h3>\n<p>应用层发送的数据，会在 TCP 的发送端缓存起来，统一分片或打包；到接收端端时候，也是直接按照字节流将数据传送给应用层。对比来看，UDP 就不会做这个工作，一般一个应用的数据就是一个UDP包。</p>\n<h4 id=\"tcp-协议头\">TCP 协议头</h4>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/tcp1.png") + "\" alt=\"\"></p>\n<h5 id=\"source-port--destination-port\">source port &amp; destination port</h5>\n<p>TCP 头中的 源端口 和 目标端口，分别对应发出／接收请求的应用端口。这与IP层中的IP地址对一起，标识了一个TCP连接。一个IP地址和一个端口号的组合叫做一个<strong>endpoint</strong>或者<strong>socket</strong>。也即一对endpoint或者一对socket唯一的标识了一个TCP连接。接收端的TCP层就是根据不同的端口号来将数据包传送给应用层的不同程序，这个过程叫做<strong>解复用</strong>(demultiplex)。相应的发送端会把应用层不同程序的数据映射到不同的端口号，这个过程叫做<strong>复用</strong>(multiplex)。</p>\n<h5 id=\"seq-number--ack-number\">Seq Number &amp; Ack Number</h5>\n<p>序列码（SN）和 应答码（ACK），分别用来标识当前传送的包的序列号，和期望接收的下一个包的序列号。这两个参数主要是防止丢包和包乱序，具体可参考后面的通信过程。</p>\n<p>当 SYN 标识位有效时，序列码实际上是初始序列码（ISN，inital SN），而第一个数据的字节是 ISN + 1 byte。</p>\n<h5 id=\"window-size\">Window Size</h5>\n<p>用来标识当前接收端还愿意接收多少bytes的数据。用于流量控制。</p>\n<h5 id=\"checksum位\">CheckSum位</h5>\n<p>CheckSum 是根据伪头+TCP头+TCP数据三部分进行计算的。送端基于数据内容计算一个数值，接收端要与发送端数值结果完全一样，才能证明数据的有效性。接收端checksum校验失败的时候会直接丢掉这个数据包。</p>\n<h5 id=\"urgent--pointer\">Urgent  Pointer</h5>\n<p>优先指针（紧急,Urgent  Pointer）：16位，指向后面是优先数据的字节，在URG标志设置了时才有效。如果URG标志没有被设置，紧急域作为填充。加快处理标示为紧急的数据段。</p>\n<h5 id=\"标志位\">标志位</h5>\n<ul>\n<li><p>SYN：该标志仅在三次握手建立TCP连接时有效，用于设置 ISN。当这个标志位有效时，我们称这个包为SYN包；</p>\n</li>\n<li><p>ACK：取值1代表 ACK Number 字段有效，这是一个确认的TCP包。当有效时，我们称这个包为 ACK 包;</p>\n</li>\n<li><p>FIN(Finish)：带有该标志置位的数据包用来结束一个TCP会话，但对应端口仍处于开放状态，准备接收后续数据。当FIN标志有效的时候我们称呼这个包为FIN包（在关闭TCP连接的时候使用）。</p>\n</li>\n</ul>\n<p>其他标志位，我们就不细细解读了。</p>\n<h4 id=\"tcp-数据包的组装\">TCP 数据包的组装</h4>\n<p>由于以太网协议中一个数据包只能传1400字节左右的数据，对于比较大的内容，就需要分成不同的数据包进行传输。TCP 协议会对每个数据包进行编号，通过编号确定是否有丢包问题。收到TCP数据包后，组装还原是操作系统完成的，应用程序不会直接处理 TCP 数据包。通常来说，应用程序不必关心通信的细节，它需要的数据放在 TCP 数据包里，有自己的格式（比如 HTTP 协议）。对于操作系统来说，就是持续接受 TCP 数据包，将它们按顺序组装好，一个包不少，而不关心原始文件的数据长度（这由应用层指定，比如 HTTP 的 Content-length）。</p>\n<p>应用程序收到组装好的原始数据，以浏览器为例，就会根据 HTTP 协议的Content-Length字段正确读出一段段的数据。这也意味着，一次 TCP 通信可以包括多个 HTTP 通信。</p>\n<h3 id=\"tcp-连接\">TCP 连接</h3>\n<p>通常一次完整的TCP数据传输一般包含三个阶段，分别是连接建立(setup)、数据传输(established)和连接释放(teardown 也称为cleared 或 terminated)。</p>\n<h4 id=\"连接建立--三次握手\">连接建立 —— 三次握手</h4>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/tcp2.png") + "\" alt=\"\"></p>\n<ol>\n<li>Client 主动发起连接请求，发送包中将 SYN = 1，并随机生成一个ISN，比如 x，即 序列号 seq = x。此时 Client 处于 SYN-SENT 状态；</li>\n<li>处于监听状态的 Server 在收到SYN包之后，回复一个 ACK 包，其中 SYN = 1，ACK = 1，ack = x + 1，并随机生成一个序列码，即 seq = y。虽然在建立连接的阶段，不会传送数据，但协议规范规定，SYN 包和 FIN 包在协议规定在逻辑上面占1个Byte，因此B在接收到这个SYN包后回复的 ack = x + 1。此时 B 处于 SYN-RCVD 状态；</li>\n<li>A 在收到 B 的回复后，向 B 给出确认，其 ACK = 1，确认号 ack = y + 1。此时A进入ESTABLISHED状态，A 的 TCP 通知上层应用进程，连接已经建立；</li>\n<li>B 的 TCP 收到主机 A 的确认后，B也进入ESTABLISHED状态，同时通知其上层应用进程当前TCP 连接已经建立</li>\n</ol>\n<blockquote>\n<p>SYN 攻击</p>\n<p>在三次握手过程中，Server发送SYN-ACK之后，收到Client的ACK之前的TCP连接称为半连接（half-open connect），此时Server处于SYN_RCVD状态，当收到ACK后，Server转入ESTABLISHED状态。SYN攻击就是Client在短时间内伪造大量不存在的IP地址，并向Server不断地发送SYN包，Server回复确认包，并等待Client的确认，由于源地址是不存在的，因此，Server需要不断重发直至超时，这些伪造的SYN包将产时间占用未连接队列，导致正常的SYN请求因为队列满而被丢弃，从而引起网络堵塞甚至系统瘫痪。SYN攻击时一种典型的DDOS攻击，检测SYN攻击的方式非常简单，即当Server上有大量半连接状态且源IP地址是随机的，则可以断定遭到SYN攻击了。</p>\n</blockquote>\n<h4 id=\"通信过程\">通信过程</h4>\n<p>在建立连接之后，就可以通过TCP协议进行通信了。\n<img src=\"" + __webpack_require__("./src/articles/tech/img/tcp3.jpeg") + "\" alt=\"\"></p>\n<p>每次发送端在发送数据时，都会指定seq和数据长度length，以及期望收到的下一个数据包的序列号ack。比如第一次，A发送包的序列号为1，数据长度为100，B 在收到这个包后，会返回下一次希望获取的包序列号为101，同时发送自己的数据的序列号1和数据长度200；A收到后，回复下一次希望收到的序列号201，并发送B期望的序列号101及新的数据长度，如此循环。</p>\n<h4 id=\"关闭连接--四次挥手\">关闭连接 —— 四次挥手</h4>\n<p><img src=\"" + __webpack_require__("./src/articles/tech/img/tcp4.png") + "\" alt=\"\"></p>\n<ol>\n<li><p>初始状态下A和B都是处于ESTABLISHED状态，当应用层没有待发数据而指示A关闭TCP连接的时候，A 设置连接释放报文段首部的标志位 FIN = 1，ACK=1，其序号seq = u，确认号ack=v，等待 B 的确认。此时A进入FIN_WAIT_1状态；</p>\n</li>\n<li><p>B 收到A的FIN包的时候，发出确认，由于FIN包与SYN包类似都在逻辑上占1byte，因此确认号 ack = u + 1，而这个报文段自己的序号 seq = v。此时B进入CLOSE_WAIT状态，TCP 服务器进程通知高层应用进程；</p>\n</li>\n<li><p>当A收到B的ACK确认包后，A进入FIN_WAIT_2状态；</p>\n</li>\n<li><p>若 B 已经没有要向 A 发送的数据，其应用进程就通知 TCP 释放连接。B 设置连接释放报文首部的FIN=1，ACK=1，报文序列号seq=v，确认号ack=u+1。此时B进入LAST_ACK状态。；</p>\n</li>\n<li><p>A 收到连接释放报文段后，必须发出确认，在确认报文段中 ACK = 1，确认号 ack = v + 1，自己的序号 seq = u +1。 此时A进入TIME_WAIT状态。在TIME_WAIT状态下，A经过2MSL时间后就进入关闭状态。</p>\n</li>\n<li><p>在B接收到A的确认包后，B立即进入关闭状态。A和B都进入关闭状态后整个TCP连接释放。</p>\n</li>\n</ol>\n<blockquote>\n<p>有时候会省略掉第二次的ACK包，即三次挥手。</p>\n</blockquote>\n<h3 id=\"可靠性保证\">可靠性保证</h3>\n<h4 id=\"单个数据包完整性\">单个数据包完整性</h4>\n<p>在数据正确性与合法性上，TCP 用一个校验和函数来检验数据是否有误、是否完整，可用md5对数据进行加密。即协议头中的Checksum字段。</p>\n<h4 id=\"保证不丢包--正确的包顺序\">保证不丢包 &amp; 正确的包顺序</h4>\n<p>采用超时重传和捎带ACK机制。</p>\n<p>捎带 ACK 的机制，我们已经在连接的部分有所了解。每一个数据包都带有下一个数据包的编号。如果下一个数据包没有收到，那么 ACK 的编号就不会发生变化。\n<img src=\"" + __webpack_require__("./src/articles/tech/img/tcp5.png") + "\" alt=\"\"></p>\n<p>举例来说，现在收到了4号包，但是没有收到5号包。ACK 就会记录，期待收到5号包。过了一段时间，5号包收到了，那么下一轮 ACK 会更新编号。如果5号包还是没收到，但是收到了6号包或7号包，那么 ACK 里面的编号不会变化，总是显示5号包。这会导致大量重复内容的 ACK。</p>\n<p>如果发送方发现收到三个连续的重复 ACK，或者超时了还没有收到任何 ACK，就会确认丢包，即5号包遗失了，从而再次发送这个包。通过这种机制，TCP 保证了不会有数据包丢失。</p>\n<h4 id=\"流量控制\">流量控制</h4>\n<p>在流量控制上，采用滑动窗口协议。\n<img src=\"" + __webpack_require__("./src/articles/tech/img/tcp6.png") + "\" alt=\"\"></p>\n<p>一个发送端的窗口如下。图中的数字表示byte也就是和上面介绍的TCP协议头中的SN是对应的，3号byte以及3号之前的数据表示已经发送并且收到了接收端的ACK确认包的数据；4、5、6三个byte表示当前可以发送的数据包，也有可能已经已经发送了但是还没有收到ACK确认包；7号byte及之后的数据表示为了控制发送速率暂时不能发送的数据。其中4-6这三个byte就称呼为窗口大小(window size)。当TCP连接建立的时候，双方会通过TCP头中的窗口大小字段向对方通告自己接收端的窗口大小，发送端依据接收端通告的窗口大小来设置发送端的发送窗口大小，另外在拥塞控制的时候也是通过调整发送端的发送窗口来调整发送速率的。</p>\n<p>基于此，在 TCP 通信的过程中，每个 ACK 都带有下一个数据包的编号，以及接收窗口的剩余容量。协议中规定，对于窗口内未经确认的分组需要重传。</p>\n<h4 id=\"拥堵控制\">拥堵控制</h4>\n<p>为什么会产生TCP的阻塞呢，其实就是发送端发送的报文速度要接收端大，导致报文丢失，需要重传。控制阻塞的基本思想是，设立一个阻塞窗口，并且控制阻塞窗口来控制发送窗口(发送窗口=min(阻塞窗口,接收窗口))。</p>\n<p>在拥堵控制上，采用TCP拥堵控制算法（AIMD算法）：</p>\n<pre><code>- 加性增，乘性减\n- 慢启动\n- 对超时事件做出反应\n\n</code></pre><p>拥堵又分为两种情况：</p>\n<ol>\n<li><p>重传定时器溢出了，那肯定就是有很多报文没有按时发送到接收端或者接收端的ACK报文没有到达发送端；</p>\n</li>\n<li><p>另一种情况是没有阻塞情况没那么严重的情况，这种情况的特征是同一个报文确定了四次，这也证明了这个报文传输过程中丢失了。</p>\n</li>\n</ol>\n<p>TCP对于阻塞控制一共有四种算法，分别是慢启动，阻塞避免，快重传，快恢复四种算法。对于第一种情况就是重传定时器溢出的情况，TCP一般采取的措施是慢启动和拥塞避免。对于第二种情况，采用快重传快恢复算法。</p>\n<h5 id=\"慢启动\">慢启动</h5>\n<p>服务器发送数据包，当然越快越好，最好一次性全发出去。但是，发得太快，就有可能丢包。</p>\n<p>TCP 协议为了做到效率与可靠性的统一，设计了一个慢启动（slow start）机制。开始的时候，发送得较慢，然后根据丢包的情况，调整速率：如果不丢包，就加快发送速度；如果丢包，就降低发送速度。Linux的内核规定第一次发送10个数据包，然后动态调整。</p>\n<p>两种算法示意图如下：\n<img src=\"" + __webpack_require__("./src/articles/tech/img/tcp7.jpg") + "\" alt=\"\"></p>\n<p>ssthresh值是一个临界点，在拥塞窗口大小小于这个值时，会指数级增长，一旦到达后，会变为加性增长。</p>\n<p>总结来说，两种情况下，在拥塞出现的时候，都会将ssthresh值适当降低。不同之处在于，第1种超时情况下，会迅速降低拥塞窗口值，然后从慢启动开始增加；在第2种情况下，只会降低到新的ssthresh值，然后加性增加。</p>\n<h2 id=\"与-udp-协议对比\">与 UDP 协议对比</h2>\n<p>UDP（User Data Protocol，用户数据报协议）是与TCP相对应的协议。它是面向非连接的协议，它不与对方建立连接，而是直接就把数据包发送过去。</p>\n<p>UDP适用于一次只传送少量数据、对可靠性要求不高的应用环境。比如，我们经常使用“ping”命令来测试两台主机之间TCP/IP通信是否正常，其实“ping”命令的原理就是向对方主机发送UDP数据包，然后对方主机确认收到数据包，如果数据包是否到达的消息及时反馈回来，那么网络就是通的。例如，在默认状态下，一次“ping”操作发送4个数据包。发送的数据包数量是4包，收到的也是4包（因为对方主机收到后会发回一个确认收到的数据包）。这充分说明了UDP协议是面向非连接的协议，没有建立连接的过程。正因为UDP协议没有连接的过程，所以它的通信效果高；但也正因为如此，它的可靠性不如TCP协议高。</p>\n<p>TCP 协议和 UDP 协议的差别：</p>\n<pre><code>| | TCP  | UDP\n| -----|------------- | -------------\n| 传输可靠性  | 可靠 | 不可靠 \n| 应用场合 |   传输大量数据 | 少量数据 \n| 速度    |    慢  |        快\n\n\n\n\n</code></pre><h4 id=\"参考资料\">参考资料</h4>\n<blockquote>\n<p>https://blog.csdn.net/ningdaxing1994/article/details/73076795\nhttps://www.cnblogs.com/buxiangxin/p/8336022.html\nhttps://baike.baidu.com/item/TCP/33012?fr=aladdin</p>\n</blockquote>\n";

/***/ }),

/***/ "./src/articles/trips/content.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "content", function() { return content; });
var content = [{
  category: '旅行记录',
  articles: [{
    link: '/trip/tibet',
    title: '高原之行',
    abstract: '探索神秘西藏',
    img: '/img/2.jpeg',
    showInIndex: true
  }, {
    link: '/trip/japan',
    title: '岛国之旅',
    abstract: '小而精致的国家',
    img: '/img/3.jpeg',
    showInIndex: true
  }]
}];

/***/ }),

/***/ "./src/biz-components/Cover/Index.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _style_less__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/biz-components/Cover/style.less");
/* harmony import */ var _style_less__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_style_less__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./node_modules/antd/es/index.js");
/* harmony import */ var articles_tech_content__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/articles/tech/content.tsx");
/* harmony import */ var articles_trips_content__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/articles/trips/content.tsx");
/* harmony import */ var components_ArticleList__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./src/components/ArticleList.tsx");







var Cover = function Cover() {
  return react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react__WEBPACK_IMPORTED_MODULE_0__["Fragment"], null, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "cover-content"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "big-img-container"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "big-img"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("img", {
    src: "img/swiss.JPG"
  }))), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Row"], {
    type: "flex",
    justify: "end"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Col"], {
    span: 18
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "hero-title"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("h1", null, "Life is an adventure, enjoy it ;)"))), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Col"], {
    span: 12
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "hero-meta"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("p", null, "\u70ED\u7231\u63A2\u7D22\uFF0C\u559C\u6B22\u65B0\u5947\uFF0C\u6D3B\u529B\u6EE1\u6EE1\u768421\u4E16\u7EAA\u65B0\u7A0B\u5E8F\u5458"), react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "author"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "author-img"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("img", {
    src: "img/portal.JPG"
  })), react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "author-meta"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", {
    className: "author-name"
  }, "Xiao"), react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", {
    className: "author-tag"
  }, "Web Frontend Coder"))))))), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](components_ArticleList__WEBPACK_IMPORTED_MODULE_5__["default"], {
    content: articles_tech_content__WEBPACK_IMPORTED_MODULE_3__["content"],
    articleGroupTitle: "\u6B63\u7ECF\u5DE5\u7A0B\u5E08"
  }), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](components_ArticleList__WEBPACK_IMPORTED_MODULE_5__["default"], {
    content: articles_trips_content__WEBPACK_IMPORTED_MODULE_4__["content"],
    articleGroupTitle: "\u4E1A\u4F59\u65C5\u884C\u5BB6"
  }));
};

/* harmony default export */ __webpack_exports__["default"] = (react__WEBPACK_IMPORTED_MODULE_0__["memo"](Cover));

/***/ }),

/***/ "./src/biz-components/Cover/route.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LinkComponent", function() { return LinkComponent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RouteComponent", function() { return RouteComponent; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/react-router-dom/esm/react-router-dom.js");
/* harmony import */ var _Index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/biz-components/Cover/Index.tsx");



var LinkComponent = react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
  to: "/"
});
var RouteComponent = react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
  path: "/",
  component: _Index__WEBPACK_IMPORTED_MODULE_2__["default"]
});

/***/ }),

/***/ "./src/biz-components/Cover/style.less":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/biz-components/Tech/Index.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Users_erra_tencent_git_proj_my_site_node_modules_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./node_modules/antd/es/index.js");
/* harmony import */ var articles_tech_content__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/articles/tech/content.tsx");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./node_modules/react-router-dom/esm/react-router-dom.js");





var SubMenu = antd__WEBPACK_IMPORTED_MODULE_2__["Menu"].SubMenu;
var useState = react__WEBPACK_IMPORTED_MODULE_1__["useState"],
    useEffect = react__WEBPACK_IMPORTED_MODULE_1__["useEffect"];

var findArticleIndex = function findArticleIndex(data, title) {
  var subIndex = 0;
  var index = data.findIndex(function (cat) {
    subIndex = cat.articles.findIndex(function (article) {
      return article.link.split('/').pop() === title;
    });
    return subIndex > -1;
  });
  index = index === -1 ? 0 : index;
  return "article_".concat(index, "_").concat(subIndex);
};

var Tech = function Tech(props) {
  var _useState = useState(['article_0_0']),
      _useState2 = Object(_Users_erra_tencent_git_proj_my_site_node_modules_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
      selectedKeys = _useState2[0],
      setSelectedKeys = _useState2[1];

  var title = props.match.params.title || articles_tech_content__WEBPACK_IMPORTED_MODULE_3__["content"][0].articles[0].link.replace('/tech/', '');
  useEffect(function () {
    setSelectedKeys([findArticleIndex(articles_tech_content__WEBPACK_IMPORTED_MODULE_3__["content"], title)]);
    console.log('setSelectedArticle', findArticleIndex(articles_tech_content__WEBPACK_IMPORTED_MODULE_3__["content"], title));
  }, [title]);

  var getMenuBar = function getMenuBar() {
    var res = [];
    articles_tech_content__WEBPACK_IMPORTED_MODULE_3__["content"].forEach(function (cat, i) {
      var articlesComponents = [];
      cat.articles.forEach(function (article, j) {
        console.log("article_".concat(i, "_").concat(j));
        articlesComponents.push(react__WEBPACK_IMPORTED_MODULE_1__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Menu"].Item, {
          key: "article_".concat(i, "_").concat(j)
        }, react__WEBPACK_IMPORTED_MODULE_1__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_4__["Link"], {
          to: article.link
        }, article.title)));
      });
      res.push(react__WEBPACK_IMPORTED_MODULE_1__["createElement"](SubMenu, {
        key: "cat_".concat(i),
        title: react__WEBPACK_IMPORTED_MODULE_1__["createElement"]("span", null, react__WEBPACK_IMPORTED_MODULE_1__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Icon"], {
          type: "appstore"
        }), react__WEBPACK_IMPORTED_MODULE_1__["createElement"]("span", null, cat.category))
      }, articlesComponents));
    });
    return res;
  };

  var handleMenuClick = function handleMenuClick(e) {
    console.log(e);
  };

  var MenuBarContent = getMenuBar();

  var articleHtml = __webpack_require__("./src/articles/tech sync recursive ^\\.\\/.*\\.md$")("./".concat(title, ".md"));

  console.log('render', selectedKeys);
  return react__WEBPACK_IMPORTED_MODULE_1__["createElement"]("div", {
    className: "tech-content"
  }, react__WEBPACK_IMPORTED_MODULE_1__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Row"], null, react__WEBPACK_IMPORTED_MODULE_1__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Col"], {
    span: 6
  }, react__WEBPACK_IMPORTED_MODULE_1__["createElement"]("div", {
    className: "side-nav"
  }, react__WEBPACK_IMPORTED_MODULE_1__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Menu"], {
    mode: "inline",
    onClick: handleMenuClick,
    selectedKeys: selectedKeys,
    defaultOpenKeys: ['cat_0', 'cat_1'],
    inlineIndent: 14
  }, MenuBarContent))), react__WEBPACK_IMPORTED_MODULE_1__["createElement"](antd__WEBPACK_IMPORTED_MODULE_2__["Col"], {
    span: 18,
    className: "article-content"
  }, react__WEBPACK_IMPORTED_MODULE_1__["createElement"]("div", {
    dangerouslySetInnerHTML: {
      __html: articleHtml
    }
  }))));
};

/* harmony default export */ __webpack_exports__["default"] = (react__WEBPACK_IMPORTED_MODULE_1__["memo"](Tech));

/***/ }),

/***/ "./src/biz-components/Tech/route.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LinkComponent", function() { return LinkComponent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RouteComponent", function() { return RouteComponent; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/react-router-dom/esm/react-router-dom.js");
/* harmony import */ var _Index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/biz-components/Tech/Index.tsx");



var LinkComponent = react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
  to: "/tech"
}, "Techs");
var RouteComponent = react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
  path: "/tech/:title?",
  component: _Index__WEBPACK_IMPORTED_MODULE_2__["default"]
});

/***/ }),

/***/ "./src/biz-components/Trip/Index.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var components_ArticleList__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/components/ArticleList.tsx");
/* harmony import */ var articles_trips_content__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/articles/trips/content.tsx");




var Trips = function Trips() {
  return react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "trip-content"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](components_ArticleList__WEBPACK_IMPORTED_MODULE_1__["default"], {
    content: articles_trips_content__WEBPACK_IMPORTED_MODULE_2__["content"],
    articleGroupTitle: "\u4E1A\u4F59\u65C5\u884C\u5BB6",
    hideImage: false,
    hideMoreBtn: true
  }));
};

/* harmony default export */ __webpack_exports__["default"] = (Trips);

/***/ }),

/***/ "./src/biz-components/Trip/route.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LinkComponent", function() { return LinkComponent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RouteComponent", function() { return RouteComponent; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/react-router-dom/esm/react-router-dom.js");
/* harmony import */ var _Index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/biz-components/Trip/Index.tsx");



var LinkComponent = react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
  to: "/trip"
}, "Trips");
var RouteComponent = react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
  path: "/trip",
  component: _Index__WEBPACK_IMPORTED_MODULE_2__["default"]
});

/***/ }),

/***/ "./src/components/ArticleList.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/antd/es/index.js");



var ArticleList = function ArticleList(props) {
  var _props$articleGroupTi = props.articleGroupTitle,
      articleGroupTitle = _props$articleGroupTi === void 0 ? '' : _props$articleGroupTi,
      _props$content = props.content,
      content = _props$content === void 0 ? [] : _props$content,
      _props$hideMoreBtn = props.hideMoreBtn,
      hideMoreBtn = _props$hideMoreBtn === void 0 ? false : _props$hideMoreBtn,
      _props$hideImage = props.hideImage,
      hideImage = _props$hideImage === void 0 ? false : _props$hideImage;

  var getArticles = function getArticles() {
    var res = [];
    content.forEach(function (cat) {
      cat.articles.forEach(function (article) {
        if (article.showInIndex) {
          res.push(article);
        }
      });
    });
    return res;
  };

  return react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "container"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Row"], {
    type: "flex",
    justify: "center"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "nav-list"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "article-group-title"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("h2", null, articleGroupTitle)), getArticles().map(function (article) {
    return react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Col"], {
      span: hideMoreBtn ? 24 : 12,
      className: "abstract-block"
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("a", {
      href: article.link
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
      className: "article-card"
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Row"], null, !hideImage ? react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Col"], {
      span: 8
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
      className: "article-img"
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("img", {
      src: article.img
    }))) : null, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Col"], {
      span: hideImage ? 24 : 16
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
      className: "article-meta text-left ".concat(hideMoreBtn ? 'full-width' : '')
    }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("h2", null, article.title), react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("p", null, article.abstract)))))));
  }))), !hideMoreBtn ? react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Row"], {
    type: "flex",
    justify: "center"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_1__["Col"], {
    span: 4
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("a", {
    href: "/tech",
    className: "more-btn"
  }, "More Articles"))) : null);
};

/* harmony default export */ __webpack_exports__["default"] = (ArticleList);

/***/ }),

/***/ "./src/index.css":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/pages/index.tsx":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/react-dom/index.js");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/index.css");
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_index_css__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _styles_css_index_less__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/styles/css/index.less");
/* harmony import */ var _styles_css_index_less__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_css_index_less__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./node_modules/antd/es/index.js");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./node_modules/react-router-dom/esm/react-router-dom.js");
/* harmony import */ var biz_components_Tech_route__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("./src/biz-components/Tech/route.tsx");
/* harmony import */ var biz_components_Trip_route__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("./src/biz-components/Trip/route.tsx");
/* harmony import */ var biz_components_Cover_route__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("./src/biz-components/Cover/route.tsx");


 // import * as serviceWorker from './serviceWorker';

 // import loadable from '@loadable/component'
// import pMinDelay from 'p-min-delay'






 // loading Navbar, delay 2s
// const NavBar = loadable(() => pMinDelay(import(/* webpackChunkName: "NavBar" */ './NavBar'), 2000), {
//   fallback: <div>Loading...</div>,
// })

function IndexContent() {
  var location = Object(react_router_dom__WEBPACK_IMPORTED_MODULE_5__["useLocation"])();
  return (//   <TransitionGroup>
    //     {/*
    //       This is no different than other usage of
    //       <CSSTransition>, just make sure to pass
    //       `location` to `Switch` so it can match
    //       the old location as it animates out.
    //     */}
    //     {/* While this component is meant for multiple Transition or CSSTransition children, 
    //         sometimes you may want to have a single transition child with content that you want to be transitioned out 
    //         and in when you change it (e.g. routes, images etc.) In that case you can change the key prop of the transition child as you change its content, 
    //         this will cause TransitionGroup to transition the child out and back in.
    //       */ 
    //     }
    //     <CSSTransition
    //       // key 是为了每次重新渲染的时候，重新卸载&加载component，才能触发transition效果
    //       // 此处只是子组件的content变了，Transition组件并没有变，所以需要用key强制重载
    //       // location.key - A unique string representing this location
    //       key={location.key}
    //       classNames="fade"
    //       timeout={300}
    //     >
    react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_5__["Switch"], {
      location: location
    }, biz_components_Tech_route__WEBPACK_IMPORTED_MODULE_6__["RouteComponent"], biz_components_Trip_route__WEBPACK_IMPORTED_MODULE_7__["RouteComponent"], biz_components_Cover_route__WEBPACK_IMPORTED_MODULE_8__["RouteComponent"]) //     </CSSTransition>
    //   </TransitionGroup>

  );
}

var App = function App() {
  return react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "App"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_5__["BrowserRouter"], null, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_4__["Row"], {
    type: "flex",
    align: "middle",
    className: "nav"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_4__["Col"], {
    span: 7,
    offset: 1
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](react_router_dom__WEBPACK_IMPORTED_MODULE_5__["Link"], {
    to: '/',
    className: "navbar-brand"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("img", {
    className: "logo",
    src: "/img/logo.png",
    width: "50"
  }), react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null, "\u5C0F\u4E16\u754C"))), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_4__["Col"], {
    span: 2,
    offset: 10,
    className: "nav-item"
  }, biz_components_Tech_route__WEBPACK_IMPORTED_MODULE_6__["LinkComponent"]), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_4__["Col"], {
    span: 2,
    className: "nav-item"
  }, biz_components_Trip_route__WEBPACK_IMPORTED_MODULE_7__["LinkComponent"])), react__WEBPACK_IMPORTED_MODULE_0__["createElement"](IndexContent, null), react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("footer", {
    className: "container-fluid"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", {
    className: "container"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_4__["Row"], {
    type: "flex",
    justify: "center",
    align: "middle"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"](antd__WEBPACK_IMPORTED_MODULE_4__["Col"], {
    span: 10,
    className: "footer"
  }, react__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null, "\xA9 copy DENG Xiao All Rights Received. ")))))));
};

react_dom__WEBPACK_IMPORTED_MODULE_1__["render"](react__WEBPACK_IMPORTED_MODULE_0__["createElement"](App, null), document.getElementById('root')); // If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();

/***/ }),

/***/ "./src/styles/css/index.less":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ })

},[["./src/pages/index.tsx","runtime-index","vendors~index~techs","vendors~index"]]]);
//# sourceMappingURL=index.1c597ab9.chunk.js.map