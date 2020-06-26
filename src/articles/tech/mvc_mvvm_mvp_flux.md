# MV*与Flux模式简析

> 本文介绍并对比了 MVC、MVP、MVVM 几种框架模型，并以 Flux、React、Redux、Elm、Mbox、Reactive Programming 等举例分析其模型实质。

# MVC

对于 MVC 模型，一个重要的定义就是划分了三个模块：

- Model：负责管理应用的领域模型数据与行为
- View：代表Model的UI展示
- Controller： 接受用户输入，管理Model及View的更新

但是三者是如何交互的，以及各自的依赖关系，并没有一个比较明确的定义，各个框架的实现都不尽相同。

两种比较常见的描述如下：

#### 1、Controller 通知 View 更新

<img src="/img/articles/standard-mvc.jpg" width="800">

当用户操作 UI 界面时，Controller 负责响应用户事件，更新 Model并通知 View 更新，View 再从 Model 中 query 获取数据。

#### 2、Model 通知 View 更新
<img src="/img/articles/mvc-2.png" width="800">

在这种定义中，数据流是单向的，同时 View 的更新是由 Model 控制的，不直接与 Controller 交互。


无论三者如何交互，**其依赖关系都是一致的，Controller 和 View 都依赖 Model，而 Model 对两者不感知。**1和2的区别在于由谁来通知 View 更新，且1对于事件的定义更全面，不限于是用户通过 View 操作的事件，要知道，即使是 Web UI，也会有非用户行为事件，例如网络请求回调、URL地址变更等等。更大范围地看，server端的事件通常只有不同url的request请求，并根据请求操作数据，渲染不同的View。无论是哪种通知形式，MVC的目的都是让Model的变化可以及时反馈到 View 中。

MVC中，controller 是有业务逻辑的，虽然我们强调"fat model, skinny controller"，但controller中还是有与业务相关的逻辑来决定将如何转发用户的请求，最典型的决定是转发到哪个Model层，比如路由。Model应该被更准确的称为Domain Model(领域模型)，它不代表具体的Class或者Object，也不是单纯的databse，而是一个“层”的概念：数据在Model里得到存储，Model提供方法操作数据(Model的行为)。所以Model代码可以有业务逻辑，甚至可以有数据的存储操作的底层服务代码。

# MVP 和 MVVM

## MVP

MVP 是 MVC 的变种，目的是为了更好地隔离 Model 和 View。在 MVP 中，Presenter 可以理解为松散的 Controller，包含了视图的 UI 业务逻辑，所有从视图发出的事件，都会通过代理给 Presenter 进行处理；同时，Presenter 也通过视图暴露的接口与其进行通信。Presenter 负责对模型的更新和读取，而 Model 改变时，可以将信息通知给 Observer Presenter。


<img src="/img/articles/standard-MVP.jpg" width="800">

假设 View 是完全被动的，并且不再根据模型来更新本身的内容，即被动示图（Passive View），那么View就不再依赖 Model，它的更新完全由 Presenter 来间接控制。因为视图层不依赖其他任何层级，也就最大化了视图层的可测试性，同时也将视图层和模型层进行了合理的分离，两者不再相互依赖。

与被动视图中状态同步都需要显式的操作不同，监督控制器（Supervising Controller）就将部分需要显式同步的操作变成了隐式的：

<img src="/img/articles/Supervising-Controller.jpg" width="800">

视图层接管了一部分视图逻辑，主要内容就是同步简单的视图和模型的状态；而监督控制器就需要负责响应用户的输入以及一部分更加复杂的视图、模型状态同步工作。对于用户输入的处理，监督控制器的做法与标准 MVP 中的 Presenter 完全相同；但是对于视图、模型的同步工作，监督控制器会尽可能地将所有简单的属性以数据绑定的形式声明在视图层中。通过这种方式能够减轻监督控制器的负担，减少其中简单的代码，将一部分逻辑交由视图进行处理；这样也就导致了视图同时可以被 Presenter 和数据绑定两种方式更新，相比于被动视图，监督控制器的方式也降低了视图的可测试性和封装性。

## Presentation Model
Presentation Model（以下简称PM）与 MVP 比较相似，它从View层中分离了行为和状态，并创建了一个View的抽象，即 Presentation Model。


PM 模式将视图中的全部状态和行为放到一个单独的展示模型PM中，协调领域对象（模型）并且为视图层提供一个接口。换言之，PM包含所有UI需要的数据和行为，但不包含实际渲染 UI 的逻辑。相应的，View 负责将 PM 的状态映射到实际的 UI 展示。

PM 中应当包括需要展示的数据以及一些enable信息，比如一个输入框展示与否（isShowInput）取决与一个checkbox是否勾选（isCheckboxChecked），那么 PM 中就应当包含checkbox状态改变后同步修改 isShowInput 的逻辑。

### 状态同步

PM模式中，一个比较麻烦的点就是 PM 和 View 的状态同步。到目前为止，我们能够放置状态同步代码的地方其实只有两个，也就是视图和展示模型：如果将同步的代码放在视图中，那么可能会影响视图的测试；如果将代码放在展示模型中，实际上就为展示模型增加了视图的依赖，导致不同层级之间的耦合。同样以上面的例子解释，就是当View中的checkout的checked属性改变之后，是由View来调用PM的方法handleCheckboxChange之后紧接着将PM的PMState. isCheckboxChecked同步到ViewState. isCheckboxChecked，还是View 仅仅调用PM的handleCheckboxChange方法，而PM在这个方法的实现里将PMState. isCheckboxChecked同步到ViewState. isCheckboxChecked。

显而易见，后者会使PM依赖View，不便于View的插件式更新。而引入PM的一个目的，通常是为了将同一PM应用与不同的View，所以会将同步逻辑放在View层级。

MVC 与 MVP 的界限有时候会比较模糊，一个比较容易区分的方式，就是看 View 和 Model 之间是否是解耦的。如果是的话，通常来说更接近MVP模式。

### PM 中各个模块的关系

	View  - |							   | - Model
	View  - | - - - Presentation Model --- | - Model
	View  - |         
	
在 PM 模式中，一个 PM 可以对应多个View也可以多个Model，但是一个View 只能有一个 PM。



#MVVM

即Model-View-ViewModel。


### MVVM 与 PM

MVVM 架构模式是微软在 2005 年诞生的，实际上它就是基于 PM 的规范设计的。从 Model-View-ViewModel 这个名字来看，它由三个部分组成，也就是 Model、View 和 ViewModel；其中视图模型（ViewModel）其实就是 PM 模式中的展示模型，在 MVVM 中叫做视图模型。

除了我们非常熟悉的 Model、View 和 ViewModel 这三个部分，在 MVVM 的实现中，还引入了隐式的一个 Binder 层，而声明式的数据和命令的绑定在 MVVM 模式中就是通过它完成的，这也是 MVVM 与 MVP 区别的关键，即在于 ViewModel 更新 View 的方式。MVVM的技术基础在于，需要有一套机制实现 View 和 ViewModel 的数据绑定，这意味着 ViewModel 上的变化会实时的体现到 View 的更新上，而 View 上的一些事件变化也会直接改变ViewModel 的值，MVVM 模式通过 ViewModel 和 View 的这种双向绑定的机制替代了 MVP 模式中P和V的手动桥接。在 ViewModel 和 Model 的关系上，和 Presenter 和 Model 的关系是类似的。

### React 组件更新、React Hooks 与 MVVM 模式

以React 为例，虽然React 的定位是 View 层的框架，但个人认为，就组件的更新机制来说，也是一个类似MVVM的模式。

组件的 props 对应model，将props 转换为 Child Components 或者 Virtual DOM 所需的 props 的逻辑部分对应 ViewModel（比如hooks）它可以有自己的内部状态即 state，而组件 render 或者 return 的 JSX 部分对应 View（也可以包括真实的 DOM）。而 react 组件实际上是使用了一个隐式的 binder 来实现 ViewModel 和 View 的同步—— 每次state变更都会导致组件重新渲染即rerender，从而更新 View（JSX中可能使用state变量）， 而 View 的更新比如用户事件会触发ViewModel中对应的 event handler，从而改变 ViewModel 的state值，再一次更新 View。 这么看起来，我们可以说 MVVM 将视图和展示模型之间的同步代码放到了视图层（JSX）中，也可以说通过隐式的方法实现了状态的同步。

而对于有状态的组件来说， React Hooks 也是充当了 ViewModel 的角色。如果将有状态组件的 state 看作 Model，hooks 就有连接 Model 与 View 的作用。state 经过 hooks 处理（或透传）之后直接作为纯组件的props用于 View 的渲染，而 View 上的一些事件也会调用 hooks 方法改变 state，比如 useEffect 就可以在依赖数据变化时自动更新 Model。

### Reactive Programming 、RxJS 与 MVVM

说到 React Hooks 的 useEffect，咱们可以继续往下研究。useEffect 这种指定依赖数据，当依赖数据变化时自动执行函数的方式，实际上就形成了“观察者模式” —— Observer Pattern。而这种观察者模式，在响应式编程中运用得非常多。

响应式编程中，everything is a stream，不论是网络请求返回的数据，还是用户点击事件，都可以看作是事件流。而stream之间是可以通过 observer 的方式，实现combine、propagate、filter等功能，即当有事件A发生的时候，可以自动同时执行事件B，事件B可以是过滤A的值，或映射成别的值。同时因为是“流”的操作，自然也会使用“迭代器模式” —— Iterator Pattern。这种编程模式，比较适合需要处理大量 event stream 的场景，同时，它的设计思想也是基于函数式编程，即开发者无须关心命令式的处理细节，也无须维护各自中间变量，只需要指定将事件流映射为其他结果流的方法，作用到每一个流中具体的事件即可。下面以 RxJS 为例，简单介绍一下响应式编程的具体实现。

这个demo示意了一个列表+刷新按钮，通过请求API获取用户列表，同时点击刷新时可以更新列表。

>完整的demo及更多详情可参考<a href="https://gist.github.com/staltz/868e7e9bc2a7b8c1f754" target="__blank">此处</a>。

	// 通过 Observable 创建可被监听的按钮的点击流
	var refreshButton = document.querySelector('.refresh');
	var refreshClickStream = Rx.Observable.fromEvent(refreshButton, 'click');
	
	// 将按钮的点击流映射成 API 请求地址的方法
	var requestStream = refreshClickStream.startWith('startup click')
	  .map(function() {
	    var randomOffset = Math.floor(Math.random()*500);
	    return 'https://api.github.com/users?since=' + randomOffset;
	  });
	  
	// 将 API 请求地址流映射成 API 请求返回的方法
	// 注意这里创建responseStream的时候用到了 Promise，实际上 Promise 也就是 Observable
	var responseStream = requestStream
	  .flatMap(function(requestUrl) {
	    return Rx.Observable.fromPromise(jQuery.getJSON(requestUrl));
	  });
	
	// 监听 API 请求返回，并执行对于操作
	responseStream.subscribe(function(response) {
	  // render `response` to the DOM however you wish
	});
	
如上述demo所示，当有新的点击事件发生时，refreshClickStream 会发生变化，从而触发requestStream变化，进而 responseStream 随之改变，最后触发 subscribe 里与更新 DOM 相关的逻辑执行。一气呵成！这样是不是也更函数式啦？只需要指定对事件流的响应方法，而无须命令式地根据事件手动调用相应的处理方法。

这种模式，也类似 MVVM 。比如这个场景，API 请求的返回是 Model，这段代码对应的就是 ViewModel：responseStream.subscribe 的函数监听 Model 的改变，自动触发 View 更新；而当 View 上发生 click 事件的时候，自动触发 requestStream 、responseStream 变化从而更新 Model。


### Mobx 与 MVVM

最后，再看看 Mbox 这种同样符合 MVVM 及运用了响应式编程理念的模式。

看下官方的 tutorial 代码，实现一个 TODO list：
>完整的demo及更多详情可参考<a href="https://mobx.js.org/getting-started.html" target="__blank">此处</a>。

首先，mobx 需要定义一个 class 形式的 store，封装数据与方法。其中 @observable 装饰器用来表示可以被监听变化的变量，与响应式编程中 observable 的概念一致。而 @computed 用来标识 derivation，即 observable 变量的衍生。 mobx.autorun 指定自动执行某个函数，当函数使用到的 observable 发生变化时，且具体到字段，比如demo中report函数只使用了todo.completed === false 的变量，所以修改某个未完成的todo变量时（比如todo.name === 'another one')，不会触发report执行。

	class ObservableTodoStore {
		@observable todos = [];
	    	@observable pendingRequests = 0;

	    constructor() {
	        mobx.autorun(() => console.log(this.report));
	    }
	
		@computed get completedTodosCount() {
	    	return this.todos.filter(
				todo => todo.completed === true
			).length;
	    }
	
		@computed get report() {
			if (this.todos.length === 0)
				return "<none>";
			const nextTodo = this.todos.find(todo => todo.completed === false);
			return `Next todo: "${nextTodo ? nextTodo.task : "<none>"}". ` +
				`Progress: ${this.completedTodosCount}/${this.todos.length}`;
		}
	
		addTodo(task) {
			this.todos.push({
				task: task,
				completed: false,
				assignee: null
			});
		}
	}
	

	const observableTodoStore = new ObservableTodoStore();
                        
定义完store，我们再将其与 React 组件绑定起来。@observer 装饰器的作用在于，使 React 组件可以监听 store 的变化，当obervable变化时，自动更新对应的部分。

	@observer
	class TodoList extends React.Component {
	  render() {
	    const store = this.props.store;
	    return (
	      <div>
	        { store.report }
	        <ul>
	        { store.todos.map(
	          (todo, idx) => <TodoView todo={ todo } key={ idx } />
	        ) }
	        </ul>
	        { store.pendingRequests > 0 ? <marquee>Loading...</marquee> : null }
	        <button onClick={ this.onNewTodo }>New Todo</button>
	        <small> (double-click a todo to edit)</small>
	        <RenderCounter />
	      </div>
	    );
	  }
	
	  onNewTodo = () => {
	    this.props.store.addTodo(prompt('Enter a new todo:','coffee plz'));
	  }
	}
	
	@observer
	class TodoView extends React.Component {
	  render() {
	    const todo = this.props.todo;
	    return (
	      <li onDoubleClick={ this.onRename }>
	        <input
	          type='checkbox'
	          checked={ todo.completed }
	          onChange={ this.onToggleCompleted }
	        />
	        { todo.task }
	        { todo.assignee
	          ? <small>{ todo.assignee.name }</small>
	          : null
	        }
	        <RenderCounter />
	      </li>
	    );
	  }
	
	  onToggleCompleted = () => {
	    const todo = this.props.todo;
	    todo.completed = !todo.completed;
	  }
	
	  onRename = () => {
	    const todo = this.props.todo;
	    todo.task = prompt('Task name', todo.task) || todo.task;
	  }
	}
	
	ReactDOM.render(
	  <TodoList store={ observableTodoStore } />,
	  document.getElementById('reactjs-app')
	);
                  
Mbox 的具体用法及概念我们在这里就不详述了，关键是看看它的设计思想。通过观察者模式的运用，mbox也算是借鉴了响应式编程的思想，但是mbox中的store并不是immutable的，是可以直接改变其字段值的，同时store的定义也是使用class来封装data和操作方法，这一点与函数式思想不符。而通过观察者模式，Model 更新自动触发 ViewModel 及 View 更新，同时View事件的响应函数在ViewModel层级上更新 Model，因此也可以说是符合   MVVM 模式的。


# MVP 和 MVVM 模式的不足

以上所述，MVP 和 MVVM 是比较适合前端的设计模式，可以实现较好的 M 和 V 分离，但是仍然存在一些可以优化的地方：

1. 无法统一抽象前端中类型繁多的事件（比如非UI操作的网络请求回调、URL地址变更等）；

2. 数据流在遇到级联更新时，会产生复杂的交错，难以定位问题根源。

针对问题2，我们来简单解释下。

当有多个View 和 View Model存在时，可能会产生级联更新。比如如果用户操作了一个 View，View 通知 View Model，VM 更新Model，Model同步更新给所有观察者 VM，VM更新对应的View，另一个View又触发 View Model 更新......于是当Model的数据变更不符合预期时，就比较难快速定位更新的来源。

在这个背景下，Flux就应运而生了。

# Flux
关于Flux的基础概念我们就不具体展开了，其模式示意图如下：

<img src="/img/articles/flux.png" width="800">

Flux 是 Facebook 提出的一种前端架构，结合 ReactJS，可以很方便地实现一套数据的双向绑定，从而实现 MVVM 或 MVP。Flux 中的 store 对应 Model，View 不变（Flux中的view更加依赖React这种渲染机制），controller-views 类似 presenter，不过仅局限于 P 更新 V 的过程（类似上面提到的React组件props/state变化会自动rerender更新View的机制）。

Flux 与 MVP 的不同之处在于，controller-views 只负责 Model 到 View 的桥接，即 View 的更新，而不会反向接受 View 的事件去更新 Model。所有 Model 的更新都是通过一个统一的 Dispatcher 接受 Actions，再调用注册或监听的 stores 的回调方法来更新对应数据，这一条路径，我理解其实 dispatcher就是一个 Controller，action用来统一各种事件，而 dispatcher 就是对事件的响应，并更新 Model。


### Elm Architecture

Elm 是一种函数式的编程语言，可以用来开发网页或 web app，并能够编译成 JavaScript。

官网的一个demo如下：

	import Browser
	import Html exposing (Html, button, div, text)
	import Html.Events exposing (onClick)
	
	main =
	  Browser.sandbox { init = 0, update = update, view = view }
	
	type Msg = Increment | Decrement
	
	update msg model =
	  case msg of
	    Increment ->
	      model + 1
	
	    Decrement ->
	      model - 1
	
	view model =
	  div []
	    [ button [ onClick Decrement ] [ text "-" ]
	    , div [] [ text (String.fromInt model) ]
	    , button [ onClick Increment ] [ text "+" ]
	    ]
	    
在 Elm 语言中，天然实现了一种所谓的“Elm Architecture”，其原理大致如下图所示：
<img src="/img/articles/elm-pattern.png" width="800">

在 Elm Architecture 中，存在三个核心的概念：

- Model：app的state
- View：将state变为html
- Update：通过message来更新state

简单来说，就是当用户操作 View 时，会通过回调函数触发 update，update 更新 model，model 变化引发 view更新，如上述demo代码所示，main就是将 view 与 update 绑定，同时 view 的定义也将 model 作为参数从而绑定。

可以看出来，这种模式跟 Flux 其实有类似的地方，都是通过发送 message/action，然后通过 updater/dispatcher 的处理来更新 model。据 <a href="https://guide.elm-lang.org/architecture/">Elm官方</a>说：

> In fact, projects like Redux have been inspired by The Elm Architecture, so you may have already seen derivatives of this pattern. 


## Redux

最后，我们看看 Redux，基于 Flux 规范的一种实现。  

官方宣称的，基于 Flux 的单向数据流特性，以及三大原则，可以使state的变化变得可预测是怎么一回事呢？

对比一下传统的 MVVM / MVP 模式，当应用涉及多个 Model & View的时候，如果 View 改变引起其 Model 改变，Model 改变又 导致了另一个 Model 改变，从而导致另一个 View 改变，etc. 如此引发的级联更新会导致比较难定位变化的来源，以及难预测什么时候会发生变化。

而 Redux，通过限制更新发生的时间和方式，即限制“并行修改state”与“可变化” 即immutable state，使得变化的回溯更容易。具体来说，代码不能直接修改state 也就是 Model 的值，而只能通过 dispatch 一个 action 来表达希望更改 state 的意愿。而action的处理也是串行的，处理完一个action的完整回路之后才会进入下一个action的处理。所谓的“单向数据流”，其实就是对比MVVM模式中，ViewModel 与 View 两个模块的双向交互，即 ViewModel 变更导致 View 更新，View 更新直接修改 ViewModel这种模式，Flux 是间接地通过 action 来代替后者，从而形成一个View 与 Model 之间的一个环路。

同时，Redux 的设计要求state是 immutable 的，用来处理 action 的 reducer 也应该是纯函数。

这样的机制有两个好处，首先，action的结构使得state的更新更易溯源，比较容易知道是因为什么原因要变更state的哪部分数据（想想看对比直接改state的某个字段值，哪个更直观），其次函数式特性及action的统一处理，避免了并行修改state可能导致的竞争，以及由此引入的难以复现的bug。

除此之外，Redux 还建议整个app使用一个统一的immuatable store来记录状态，便于实现server直出及hydration，以及一些时间旅行相关的特性。

但我理解，更广义地看，其实 action & dispatcher 只是修改 Model 的更好的一种方式的规范，其实本质仍然跟 MVVM 没有区别。ViewModel其实就是集合了mapStateToProps及mapDispatchToProps这一层，前者使 Model更新时触发 View 更新，将领域模型转换为视图模型，供View层展示；后者则是对 View 事件的响应，发出修改 Model 的动作，而 reducer 则是将 actions 映射为对 Model 修改的细节，包含业务逻辑，可以算是领域模型层级的操作。

## 总结

本文大致介绍了几种常见的MV*模式，有些模式间的界限并不是特别清晰，比如 MVP 和 MVVM，有些模式也没有业界统一的定义，比如 MVC。不需要纠结某种实现属于什么模式，因为往往有可能并不严格属于某一种，有可能是几种的混合，或者有可能并没有严格准守某一种的规范。需要关注的是，当我们在设计或者实现一种模式时，要能清除地了解参与的各个模块的角色，划清职责，同时注意模块间的依赖关系与解耦，如此才能形成清晰的架构，易于维护与演进。