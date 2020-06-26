# Chrome是怎么工作的？


> 本文主要翻译自 Mariko Kosaka 的 [《Inside look at modern web browser》](https://developers.google.com/web/updates/2018/09/inside-browser-part1?hl=zh_cn)系列博客，并加上了一些扩展内容和示例。主要介绍了 Chrome 的多进程结构，并结合页面渲染流程讲解了各个进程的作用。最后，简单总结了这一过程。可以帮助大家更清晰地了解从输入URL到看到Web页面中间发生了什么。

## 浏览器的多进程结构

Chrome运行时，会启动多个进程，比如以下四个：

- Browser Process：
	控制浏览器本身的功能，例如收藏夹、导航栏等，以及不可见的、权限相关的功能，例如文件读写、网络请求等（everything outside of a tab）；
- Renderer Process：
	负责页面可见部分的渲染，一个Tab对应一个进程，所以可能会有多个；
- Plugin Process：
	负责插件的运行，比如flash；
- GPU Process：
	负责GPU tasks相关运行
	
除此之外，可能还有别的，比如 Extension process，可以点击chrome菜单栏的三个点-更多工具-任务管理器查看当前正在运行的进程情况。

Chrome 之所以要设计成多进程，主要有两个原因：一个是进程崩溃了不会影响别的进程，另一个是通过沙箱隔离实现不同类型进程的权限控制，比如处理用户任意输入的render进程，就不能随意访问系统文件。不过因为各个进程间通常会有一些共用模块，比如V8引擎，又不能共享内存，就会造成比较多的内存消耗。Chrome有一个优化是，控制最大进程数量，一旦超了，就会将同个site的tab放到一个进程里运行。另一方面，Chrome也在探索服务化，将各个service解偶，使得它们更便于被组合和拆分，这样就可以根据运行硬件的实际情况，决定是更多地将服务聚拢到单个进程，还是分散到不同的进程中，以便最大限度优化硬件使用。

此外，Chrome 67版本以上已经使用了 Site Isolation 技术，就包括进程隔离。此前，同个页面中的所有iframe都是在一个进程中运行的，这可能会导致不同域名的安全问题（虽然同源策略已经提供了基础的安全防护）。Site Isolation 技术使得同个页面中的每个iframe都运行在不同进程中，通过进程隔离提升安全性。这不仅设计到进程的拆分，更改变了iframe之间的通信机制，同时在一个页面中调试也更复杂，所以这个特效也算是一个milestone。

## Navigation

那么，当我们输入一个URL，到能看见网页内容，这途中都经历了些什么呢？

### S1 - browser process 处理在地址栏中的输入

当我们在地址中进行输入的时候，browser process 的 UI thread 会获取输入内容，并判断输入是否为一个 URL。如果不是，则在搜索引擎中查找，如果是，就开始加载一个页面。

### S2 - 开始 navigation

- UI thread 通知 network thread：嘿，我需要一个网络连接
- network thread 收到后，首先通过 DNS 解析域名指向的ip，然后向目标ip发起 TCP 请求，建立连接，获取内容（应用层通常是http或者https协议）

### S3 - 解析请求返回

收到返回内容后，network thread 首先会查看头部的几个自己，确定 Content-Type。如果是file，说明是一个下载请求，会转给download manager；如果是html，则交给 renderer process。同时，在这里会进行 SafeBrowsing 检查，看当前站点是否是一个恶意站点；以及Cross-Origin Read Blocking (CORB)检查。

### S4 - 找一个 renderer process

当network thread明确该请求返回可以展示时，就会通知 UI thread 去启动或找一个空闲的 renderer process，开始接下来的渲染流程。为了优化速度，这个步骤往往会和 S2 同步执行。

### S5 - 完成 navigation

当 renderer process 启动之后，browser process 会将页面内容通过IPC(Inter Process Communicate)发给 renderer process。在收到确认之后，navigation阶段就结束了，browser process 会在此时更新浏览器页的相关信息，比如网站安全图标，然后再将该tab的浏览记录放入history里，以便前进/后退功能生效。

### S6 - 开始新的 navigation
在页面渲染完成后，renderer process 会给 navigation process 发回一个“完成”信号。此时，np会取消掉tab页的loading状态。

如果在页面加载完成后，点击了页面中的一个外链，或者在地址栏中输入新的URL，会发生什么呢？

当然，会重复navigation的步骤。不过，当前的renderer process并不会立即退出，而是会检查是否有beforeunload的事件监听。只有完成事件响应之后，才会完全退出。

#### Service Worker 的处理

Service Worker 是一个独立的进程，相当于给应用添加一层网络代理，可以用作cache，决定什么时候需要重新请求网络数据。Service Worker 是在 renderer process 中运行的！

当一个 navigation 开始的时候，network process 会先检查当前域名是否对应有注册的service worker的 scope，如果有，UI thread 就会起一个 renderer process 来运行 service worker。后者可能会使用cache的数据，也可能通知 network thread 发起新的请求。Navigation Preload是一个优化手段，在起 service worker的同时，UI thread 会通知 network thread 同步去发起网络请求，并在 header 中指明，以便在可能的情况下只加载更新的部分数据。

## Rendering

介绍完 navigation，接下来我们再具体看下 render process 的工作，即 rendering，是如何将 HTML、CSS 和 JavaScript 文件变为一个可见的web页面的。

一个 render process 可能包含如下几种线程：

- main thread 主线程，负责各种树的解析
- worker thread，负责运行部分 JS 代码（如果使用了 web worker 或者 service worker，上面已经介绍了说 service worker 是运行在 renderer process 中的）
- raster thread，负责将 render tree及相关的绘制信息转化为像素，便于屏幕展示
- compositor thread，负责将不同的layer组合成视窗可见的内容以及动画

最后两个线程是为了使页面展示更加有效和平滑，接下来我们进一步介绍下各个线程的作用。

### S1 - HTML Parsing

#### 建立DOM树

当 rendering process 收到 navigation 确认的信息并开始接收 HTML 数据的时候，就开始将 HTML 内容转换成 Document Object Model（DOM），这是浏览器内部的页面表示，包括开发者可以用 JS 来与页面元素交换的数据结构和API。

#### 子资源加载

主线程在将解析HTML为DOM的时候，一个“preload scanner”也会同步运行。当发现一个img或script标签的时候，就并行加载网络资源，将请求发给 browser process 的 network thread。

解析过程中，如果遇到script标签加载JS，那么解析过程会暂停，先获取JS资源并执行完成后，再继续解析（因为JS可能会改变页面的DOM结构）。我们也可以通过 async、defer（优先级Low）告诉浏览器我的JS不会操作DOM，可以和解析并行进行，又或者通过<link rel="preload">告诉浏览器资源很重要，需要在第一时间加载。

> 浏览器使用启发式算法，对网络资源的重要性做出最佳猜测，例如先加载CSS（Highest）然后再加载JS（High）和图片。不过这种猜测不是总是有效的，我们可以修改默认优先级。

> - 预加载：如果某些资源特别重要，我们可以通过预加载preload告诉服务器尽可能早地加载资源，加载过程不阻塞parser，且加载完成后会放到内存中不会立即执行，而是等到遇到script标签且请求的是这个资源的时候才会执行；

> - 预连接：如果有时知道资源很重要，但又不确定资源完整路径（例如版本号不确定，要先加载版本控制文件），可以通过preconnect提前与目标站点建立连接，不过会消耗CPU资源；也可以使用其子功能 dns-prefetch 预先解析 CDN 域名；

> - 预提取:  prefetch是告诉浏览器在加载完当前页面之后，有空闲的时间再去加载对应的资源。比如资源不是首屏渲染需要的，而是用户需要点击某个按钮才会需要的。浏览器会在空闲时加载资源并缓存，在需要使用时直接读取。不过如果在资源还没下载完的时候就遇到了script执行，那么浏览器会再去请求一次，造成资源浪费（preload会等待下载不会二次请求），所以确保首屏不会使用该资源。设置prefetch的资源，优先级变为Lowest。 
 
> - defer：指定JS下载与parser同步进行，且页面加载完毕后，onload事件之前才执行JS；
> - async：指定JS下载与parser同步进行，且下载完成后立即执行


一个优化JS资源下载的示例如下：

	<!DOCTYPE html>
	<html>
	<head>
		  <meta charset="utf-8">
		  <link rel="dns-prefetch" href="//i.gtimg.com/">
		  <link rel="preload" href="//i.gtimg.com/important1.js" as="script">
		  <link rel="preload" href="//i.gtimg.com/important2.js" as="script">
		 
		  <!-- used in another page -->
		  <link rel="prefetch" href="//i.gtimg.com/maybeUsed.js">
	</head>
	<body>
		  <script type="text/javascript" src="//i.gtimg.com/important1.js" defer></script>
		  <script type="text/javascript" src="//i.gtimg.com/important2.js" defer></script>
	</body>
	</html>

### S2 - CSS Parsing

在建立完DOM树之后，render process的主线程会去解析CSS文件，通过选择符计算每个Node的style。

### S3 - 布局

只是有了每个节点的样式，要绘图还是不够的，还需要确定每个节点的位置。第三步，浏览器就会通过第二步的结果进一步计算，完善每个节点的大小、位置等信息。

### S4 - 绘制

知道了每个节点的大小、形状、位置，我们还需要考虑层级，比如z-index的影响。这一步，主线程会根据用户设定生成 paint records，也就是每一步画什么，一步步完成最终绘制。

至此，浏览器就得到了所有真正开始“画”页面之前的所有信息了。值得一提的是，在动画中，如果改变了DOM结构，那么S1-S4会在每一帧中执行，同时，因为是主线程解析，所以如果运行了JS代码，是有可能占用好几帧的时间，从而导致动画卡顿的！可以通过requestAnimationFrame优化，指定在重绘也就是下一桢开始前执行某个函数，从而将JS所需时间分散到每一桢的末尾。

### S5 - Compositing

好啦，最后一步，我们就要开始画了！

将第四部得到的信息，转换成像素值的步骤，我们称为 rasterize。最初的Chrome rasterize的方式，就是先rasterize当前viewpoint的内容，当页面滚动时，再重新补充缺失的部分。显而易见，这种方式是不够高效的，特别是动画的时候，一个节点位置移动，需要全部重新计算像素图。

当代浏览器用了更复杂的 composite 技术，类似于将画布分层，先独立rasterize好各个层，动画或者移动视窗的时候，直接重新组合各个层形成新的帧就好，性能提高很多！如此，就将 **Layout tree** 转换为了 **Layer tree**。通常，浏览器会将有动画或者随页面滚动会变的元素独立成层，在开发者工具可以看到当前页面的分层情况。

一旦 layer tree 和 paint order 信息都完成了，主线程会将结果给到 composite thread；然后，composite thread 会将大的layer拆分为小的tile，然后分发给不同的 rasterize thread。当rasterize thread 计算完成后，会将结果输出到 GPU 的内存，并将改tile对应的在layer的位置、在内存的地址等信息返回给 composite thread，后者组合生成 composite frame，通过IPC返回给 browser process，送到GPU去展示（此过程browser process的主线程不会参与，因此页面更新不需要等待样式或JS阻塞，更丝滑）。这也是为什么只涉及composite的动画比修改元素大小或位置的做法体验更好的原因。

## 事件响应

最后，让我们来看下浏览器是如何相应用户输入并更新页面的。

当用户输入到来时，browser process 的 UI thread 会将事件发生的坐标等信息传给 render process 的 compositor。然后compositor会判断，这个区域是否是属于"Non-Fast Scrollable Region"，也就是不包含event handler的区域。如果不是，那么compositor就直接更新composite frame，从而更新页面；如果是，那它会将信息进一步传给主线程，询问JS是否需要处理事件回调，等JS应答之后再去更新composite frame。PS，主线程是通过 paint records 信息去查找对应的 target 的。

所以，我们在给body绑定事件回调的时候，会将整个页面都变成“Non-Fast Scrollable Region”，即使有些区域的事件不需要主线程处理，也会因为询问主线程造成资源浪费。解决方法是加一个passive属性：

	document.body.addEventListener('touchstart', event => {
	    if (event.cancelable && event.target === area) {
	         event.preventDefault()
	    }
	 }, {passive: true});

加上之后，遇到 event compositor 还是会将事件传递给主线程，不过也会同时更新 frame，而不是等待主线程响应。 如果在回调中有阻止事件的逻辑，可以加上cancalable判断，是否在当时页面已经更新了。如果要禁止一些事件，那也可以直接用css禁止掉，就不会出现frame的更新了，比如

	touch-action: pan-x; // 限制只能单指左右滑

## 总结
最后，我们来总结一下上面这么多的内容。

首先，Chrome浏览器是有很多子进程的。Browser process 负责浏览器的除Tab外的可见部分和不可见部分，如网络请求、文件读写等；Render process 负责页面的渲染，即Tab的部分，一般一个Tab对应一个 render process。

然后，展示一个页面的过程简述如下。

Browser process 的 UI thread 先获取用户在地址栏输入的 URL，然后转给 network
 thread，检查安全性通过之后，network thread 负责 HTML 的加载，并把字节流通过 IPC 给 render process。
 
 后者拿到数据后，主线程会开始进行 HTML 文件解析，生成 DOM 树，在解析过程中遇到外部资源如 JS、CSS 等，根据策略在合适的时候通知 browser process 的 network thread 去下载或自行执行 JS。生成 DOM 树之后，解析 CSS，生成 render tree（包含各节点自身样式），再通过布局生成 layout tree（包含各节点大小、位置等布局信息），接着划分层级生成 layer tree，然后加上 paint orders 信息。
 
最后，compositing thread 会将各个 layer 划分成小的块，分发给不同的 rastering threads，后者将结果存到 CPU 内存，并把各小块的信息返回给 compositing thread。compositing thread 再整合一个 composite frame 后，传给 browser process 的 GPU，展示到屏幕上。

OVER！
到此为止，应该对浏览器的底层机制有了更清晰的了解吧？了解之后才能更懂优化！