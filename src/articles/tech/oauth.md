# 开放平台 - Getting Started with OAuth 2.0 学习总结
> 本文是OAuth 2.0的学习总结，主要是对Ryan Boyd的书《Getting Started with OAuth 2.0》重点内容进行翻译，并加上了自己的一些理解和总结。

## 背景及介绍

### OAuth如何诞生

最开始Google发布Google Calender的API时，它提供给开发者访问和管理用户谷歌日历的能力。然而，达到这个目的的唯一方式就是：用户提供他的谷歌账户用户名和密码，然后应用通过谷歌私有的ClientLogin协议（proprietary protocol）去获取和操作用户在谷歌的数据。不过这样的方式下，各种应用就会向用户索要他们的谷歌账户信息,以获取其数据。Flickr就是这样一个应用。后来Flickr被Yahoo！买了，就在Google收购Blogger的几年后。Yahoo！asking for谷歌用户密码的想法把双方都吓到了，于是就促使新的私有协议发展，来解决这个问题。使用用户名密码授权还有诸多问题，比如第三方应用拿到过多权限可能导致安全问题，或者用户如果改了密码，第三方就没权拿数据了。

后来出现了新的协议，比如Google的AuthSub和Yahoo！的BBAuth，这种协议使得应用可以将用户重定向到数据提供者的授权页面，用户在这个页面下登录和授权，然后应用就可以拿到一个token，通过这个token去获取用户数据。

这解决了部分安全问题，毕竟不是直接将用户信息提供给第三方应用。不过，这样的开发成本很高。开发者如果在应用中包含了多种主流的API，就需要分别去学习各种API的授权协议。特别是一个创业公司，觉得不划算，又不愿意自己搞一套，于是大家商量商量，一致同意搞一套标准出来。这么一来，既降低了各种API的接入成本，又保证了安全性！



### 几个重要概念

* Authentication - 认证

认证是为了确认你就是你所宣称的那个人。账号是你宣称的人，密码是证明你就是那个人。

* Federated Authentication - 联合认证

大多数应用都有他们自己的账户体系，不过也有一些应用是依赖别的认证系统去识别用户的身份，这就叫做联合认证。在Web世界中，应用通常信任OpenID的提供商（比如Google和Yahoo！），让他们来进行用户身份验证。OpenID也是用于联合认证的最常用的web开放协议。

* Authorization - 授权

授权是用来验证用户是否有权限去执行某个操作，比如读取某个文档或者access某个email账户。通常认证是在授权之前进行，以便确认用户身份正确。一般的做法是，web应用首先需要你登录来验证你的身份，然后给你一个每个操作对应的access control的列表，以确保你只调用你被允许使用的数据和服务。 
* Delegated Authorization - 委托授权

委托授权是指你允许第三方代表你去执行一些操作。比如你把钥匙给泊车小哥，让他帮你停车，并且不能干别的。OAuth类似，就是用户允许第三方应用代表他去执行一些用户允许的操作。

* Roles - 一些OAuth协议流程中的重要角色

	- Resource server
	拥有用户资源的服务，一般是API的提供商。
	- Resource owner
	应用的用户，有权管理他们在resource server上资源的使用权限。
	- Client
	第三方应用，在获得resource owner允许的情况下可以代表他执行一些操作。
	- Authorization server
	授权服务获取resource owner的同意并且传递access token给client以允许其获取resource server上的资源。


### 关于signatures的争议

2007年OAuth 1.0刚出来时，要求每次API调用都要带上cryptographic signatures（加密签名），以便确保client的身份和权限。然而加密对于一般的开发者来说比较麻烦，这大大限制了OAuth的发展。后来，随着SSL/TLS的发展，API调用的安全性增强，signature也就不再那么必要了，取而代之的是bearer tokens的使用，这个token就代表了授权相关的信息。要不要取消这个签名一直存在争议，工程师们总是需要在安全性和易用性性之间平衡。取消了加密签名后，规范建议在实现OAuth 2.0，调用任何API或使用库时，我们都需要确保正确地进行了SSL/TLS证书链有效性验证，既要验证server返回的证书上的hostname跟请求的url是否一致，也要确保自己server所用证书授权的安全性。

此外，如果API提供商支持或者要求加密，你可以参考MAC Access Authentication。简单来说就是每次authorization server都会返回一个access_token作为MAC key，然后client用它对http请求进行加密。

### 开发者及应用注册
尽管协议可以实现自动注册，大部分网站还是要求开发者在他们的开发者平台填一些信息后再注册。应用注册成功之后，会获得一个client id和一个client secret，后者在将authorization code转换为access token或者刷新access token时有用。

### Client Profiles, Access Tokens和Authorization Flows

OAuth 1.0主要是针对传统的client-server web app设计的，对于其他场景（移动app，桌面app，浏览器插件等）的支持并不好。2.0 就在这方面做了改善。

#### Client Profiles

2.0定义了许多重要的client profiles：

- Server-side web app

在web server上运行的OAuth client，通过服务器端编程语言调用APIs。用户无权访问OAuth client secret或者任何access token。

- Client-side app running in a web browser

在客户端运行的程序，比如js代码写的app或者浏览器插件，用户可以看到这类app的代码和API请求。这种情况下OAuth crendentials会被看做是不保密的，所以API提供商一般不会对这种client下发secret。

- Native application

与上一类相似，也不会被发secret。

#### Access Tokens
大多数基于OAuth 2.0的API都只需要bearer tokens来验证请求者身份。bearer tokens是一种access token，只需要有token值就可以访问私密的资源，而不需要其他加密key啥的了。

获取到Access Token之后，将其加到API请求中去的方式有几种：1. 放到header里；2. 放到query string里；3. 放到form-encoded 的 body中。放头部的好处在于，header很少出现在代理服务器和访问日志的log中，且几乎不会被cache。放query利于debug，并且在client-side flow中有用。

#### Authorization Flows
任何类型的client都需要通过一个授权协议的流程来获取访问用户资源的权限。OAuth 2.0 协议定义了四种主要的“grant types”以及一种扩展机制。

* Authorization code

这种授权模式非常适合server-side的应用。当用户同意授权之后，授权服务会验证用户是否处于active session，如果是，用户会被重定向回应用，并在url的query string中带有authorization code。然后client用这个code加上client secrte和client id去换access token，这是服务器之间的通信，对于用户不可见。同时使用refresh tokens的话，可保持long-lived access to an API。

* browser-based client-side applications的隐式授权

这种授权方式是最简单的，也是对于客户端应用的优化。用户同意授权后，access token会以hash参数的形式返回，不需要中间层的authorization code，同样无法生成refresh token。

* 通过用户的密码授权

也就是说应用需要使用用户的账户名和密码去换authentication code。这只是在高度被信任的app上应用，比如API提供商自己开发的应用。应用不需要存储密码，只需要存储第一次授权后获取到的code，且用户不需要通过修改密码来取消授权。这种方式还是比传统的账户名密码认证要安全的。

* Client credentials

Client credentials允许client获取用于访问client自己所有的资源的access token，或者当授权过程已经被一个授权服务器完成时。这种授权方式适用于应用需要以自己而不是用户身份来调用某些API时，比如存储服务和数据库。


接下来我们就详细介绍这几种流程。

## Server-Side Web Application Flow

又叫**Authorization code flow**。正如上面所说，由于access token从来没有在浏览器端传递过，而只是通过传递中间层的authentication code，所以保密性较好。然而，一些使用这种模式的应用会在本地保存一个refresh token，以便在难以与用户浏览器交互获取新access token时“离线”获取用户数据。这会造成安全隐患，尽管可以实现同时获取多个用户数据。

授权流程图如下：
<!-- ![](../../styles/img/oauth1.png) -->


### 授权步骤

#### Step 1 告诉用户你要干嘛并请求授权

在这一步中，我们需要告诉用户接下来他们会被定向到授权页面。用户点击“去授权”后，会跳转到API提供商的OAuth授权页面或者在popup弹窗中展示。在这个页面，API供应商会展示出用户希望授权给第三方应用的权限列表，点击“确认授权”后会带着authorization code跳转会第三方应用。当然，用户需要登录了API提供商的服务，否则会先进入登录流程。一般API服务商的授权页面link都可在文档中找到，比如SPA Marketing API官网的就是https://developers.e.qq.com/oauth/authorize。

##### Query 参数

link中需要附上一些参数：

- client_id

应用注册时得到的id。

- redirect_uri

用户同意授权后跳转回的页面。通常也是在创建应用是注册的。

- scope

第三方应用请求访问的数据。通常这是一个以空格分隔的字符串。有效的scope值应当在API文档中找到。比如MKT API中就分为了广告投放、账户管理、数据洞察、用户行为上报、人群管理等几个类。 

- response_type

使用'code'值，用来表示用户同意授权后一个授权码会被返回。

- state

一个你的第三方应用唯一的值，这个值在每次请求中都应当是一个随机字符串，不能泄露出去。这是用来防止CSRF攻击的。

什么情况下会发生CSRF攻击呢？举个栗子。

1. erra在第三方应用ilovedog.com上登录了，然后点击了绑定我的微信账号的授权链接；
2. erra被重定向到微信的授权页面xxx.weixin.com/auth，在这个页面erra完成了微信登录；
3. 登录完成后，erra访问的页面又跳转回ilovedog.com，并且带上了授权码：ilovedog.com/code=erracode
4. 突然，erra在这里停住了，没有继续往下走，并且把第3步中的url发给了selina；
5. selina也登录了ilovedog.com，并且点击了ilovedog.com/code=erracode，此时ilovedog.com服务会拿代表erra身份的erracode去换access token，这么一来，selina在ilovedog.com上就绑定了erra的微信。如果她通过微信分享ilovedog.com中的照片到朋友圈，就会发到erra的微信朋友圈中了。或者，如果是授权微信登录，erra就可以用自己的微信登录selina的ilovedog网了。

很可怕是不是，所以state参数还是很有必要的。

##### 错误处理
当query参数中有的值无效时，比如client\_id或者redirect\_uri，authentication server应当给出错误提示，并且不要重定向回client。当用户或者authentication server拒绝授权时，应当重定向回第三方应用，并带上error参数指明错误类型，比如access\_denied。除此之外，还可以附上更详细的错误信息，例如error\_description或者error\_uri指向一个详细说明错误原因的页面。

其他OAuth 2.0 标准中规定的错误类型：

- **invalid_request**: 缺少参数、含不支持的参数、参数格式不对
- **unauthorized_client**: client没有使用这种方式获取授权码的权限
- **unsupported_response_type**: authentication server不支持通过这种方式获取授权码
- **invalid_scope**: scope值无效、缺少或格式不对
- **server_error**: 授权服务器出现错误
- **temporarily_unavailable**: 授权服务器暂时不可以用

#### Step 2 用authentication code换access token

如果没有错误发生，在用户授权后，会被重定向到redirect_uri并带上code和state两个参数。接下来，如果state检查ok，第三方应用需要用这个code区换access token。

在不借助第三方库的情况下，第三方应用需要向授权服务器发一个POST请求，并带上参数code、redirect_uri、grant_type（字符串"authorization_code", 代表要用code换access token）。此外，这个POST请求是需要进行身份认证的，认证方式有两种，一种是把client_id和client_secret分别作为username和password放到authorization header中；另一种是作为字段添加到POST请求参数中。

如果身份验证和参数检查都成功，就会返回一个JSON格式的response，并带有参数：

-**access_token**: 可用来调用API的token
-**token_type**: 通常为“bearer”
-**expires_in**: access token的剩余有效时间，秒为单位
-**refresh_token**: 一个当access token过期后可以用来重新获取的token。一般在server侧与用户身份信息对应存储，就避免每次access_token过期后都需要用户重新授权。

access_token有效时间短，一方面降低了黑客拿到明文token后操作用户数据的风险，另一方面有利于在用户取消授权后，快速废弃第三方应用的代理操作权限。

#### Step 3 调用API

得到access_token之后，我们只需要将他放入请求中，就可以调用API了。最好是按上述说的，放在Authorization header中。

##### 错误处理
遇到调用错误，例如token过期、授权失效时，会得到一个HTTP 4XX的错误。规范规定返回头中应有WWW-Authenticate字段，指明失败的原因。当然有些API供应商会返回JSON格式的错误信息数据。

#### Step4 更新access_token
为了提高应有性能，最好同时存储access_token和expire_in两个值。在调用API之前，先检查access_token是否过期。更新需要发一个POST请求，带上grant_type（值为‘refresh_token’）和refresh_token两个值。成功后，不仅会返回新的access_token，也会有新的refresh_token。

对于一些“online”的应用，他们并不想获取refresh_token，而是当access_token过期时又开始一个authorization flow，不过只要user之前授权过，这次就不需要user同意，会自动将其重定向回应用并获取授权码。

#### 解除授权
大部分API供应商都允许user手动解除授权，不过这种情况下应用通常不会得到通知，只有在下次调用是出错才知道。Facebook会在user解除授权时，向应用发一个POST请求。

此外，一些授权服务同样支持通过程序解除授权。当应用不想管了一些无用的权限时，比如用户卸载了应用，就可以通过发请求到授权服务器使token失效。这是在OAuth 2.0规范的扩展草案中提出的。


## Client-Side Web Application Flow

客户端的web应用授权过程比较简单，当用户同意授权时，会直接返回access token，而不像服务端的应用授权一样需要一个授权码。


### 适用场景
- 只需要对数据暂时的访问权限
- 用户会定期登录API Provider
- OAuth client在浏览器运行（通过JS,Flash等编写的）
- 浏览器是非常值得信任的，几乎不担心access会被泄露

<!-- ![](../../styles/img/oauth2.png) -->


### 授权步骤

#### Step 1 告诉用户你要干嘛并请求授权

这一步与服务端应用授权类似，同样需要在请求授权url时带上client_id, redirect_uri, response_type('token'), state, scope参数。错误处理也类似，不重复了。

#### Step 2 从URL中获取access token
当用户同意授权后，会被重定向会第三方应用，并以hash值的形式带上acees token，比如ilovedogs.com#access_token=shdjue678dysugfjhsw&token_type=Bearer&expires_in=3600。这样一来应用就可以直接取到access_token啦。

#### Step 3 调用API
有了access_token之后，就可以愉快地调用被授权的API了。不过因为是从客户端发起请求，涉及到跨域的问题，可以用JSONP解决。

#### Step4 更新access token
这种隐式授权方式的限制是，不提供refresh token。所以每次access token过期后，都需要重新走一遍流程。这也使得安全性有所提高。不过有些API供应商比如Google允许当用户授权过一次时，之后可以跳过请求用户授权的步骤而自动授权。如此一来，就可以在需要更新access token时，在一个隐藏的iframe中进行，提升用户体验。有一种还没写入规范的“immediate”mode，就允许这么做，并且在用户被定向到授权页面时立即将其重定向回应用，同时打印出自动授权失败的错误。

### 解除授权
与服务端应用授权类似。

## Resource Owner Password Flow
<!-- ![](../../styles/img/oauth3.png) -->

这种方式是用用户的账号和密码去换取access token，因此安全性与之前两种方式相比较低，需要第三方应用是完全可信任的。

### 适用场景
这种模式一般只使用与第三方应用是API供应商官方出品的情况下。同时为了避免被钓鱼，开发者和IT管理者需要明确告诉用户如何分辨是否是真正的官方应用。

虽然安全性不高，但这种方式相较于直接用账号、密码作为身份信息去调用API要好。一是应用只需要使用一次账号、密码信息去换access token，因此没必要保存、二是用户不需通过改密码的方式解除授权，更方便。


### 授权步骤

#### Step 1 请求用户的账号信息
第一步就是请求用户输入账号和密码。通常，当用户是从一个不受信任的网络登录时，应用还会要求用户输入一个security token，就像登录网银时需要输入的令牌，以验证登陆者的身份。

#### Step 2 交换access token
这一步与用授权码交换access token很类似，只需要发一个POST请求，并提供账号信息和client_id即可。需要提供的参数：

- grant_type: 使用值'password'
- scope（可选）
- client_id（可选）
- client_secret（可选）
- username: 用户在API供应商的账号
- password: 用户在API供应商的密码，可能需要与security token串联作为值

如果授权成功，会返回access_token。

#### Step 3 调用API
与其他模式类似。

#### Step4 更新access token
规范建议API提供商提供一种更新短有效期的access token的机制，这样可以避免应用存储用户的账户信息，这也是与传统验证相比的优势。

## Client Credentials Flow

这种模式下，client只需要提供自己的client账户信息，就可以换取access token，而不需要用户的授权。比如在client自己拥有这些数据（例如调用API提供商的云存储服务），或者用户已经通过常规认证流程之外的方式授权过的情况下。甚至都不需要发任何token，只需要看请求API的client是否有权限就行。

这种模式下，需要保证client的账户信息高度保密。client即可以通过在POST请求中添加账户信息来进行身份验证，也可通过公钥、私钥或者SSL/TLS的方式在authorization server进行身份验证。
<!-- ![](../../styles/img/oauth4.png) -->


### 授权步骤

与其他步骤类似，只是第一步中需要传递grant_type（值为"client_credentials"）、client_id、client_secret作为参数换取access token。同时，这种模式下的access token通常是长期有效的，且不提供refresh token。

## 移动应用的授权

移动应用分为两种，一种是基于HTML5和其他web技术的移动应用，另一种是原生的移动应用。前者可以使用一般的web授权方式，后者就需要额外的方式了。

### 适用场景
当移动应用有后台服务器时，我们可以用任何一种典型的web应用授权方式。如果需要长期授权，就用服务端应用授权方式；如果只需要短期授权或者一次性授权，就用客户端授权方式。

如果第三方应用没有后台服务器，我们就需要使用native app flow了。这种授权方式与服务端应用授权和客户端应用授权类似，不过有两个限制条件：一是没有web服务器用来接收redirect_uri跳转，另一个是需要保证client_secret的保密性。

根据应用平台和API提供商规定，我们可以使用类似my-mobile-app://oauth/callback这样的url作为redirect_uri的值。然而，这样的自定义uri通常很难保证唯一性，就可能造成跳到别的app里了。另一种可能是API提供商根本就不允许用这种自定义url作为回调。

在native app flow中，redirect_uri会是一个特殊的值，用来将用户定向到authorization server的一个web页面。在这个页面上，用户可以获得authorization code或者access token，再通过粘贴复制的方式输入到移动应用中，或者移动应用通过程序获取window title或者body中对应的值。

### 丑陋的web浏览器
阻碍原生应用接入OAuth授权的一个原因是，通常需要在应用中嵌入WebView或者调用手机系统的浏览器。

使用嵌入的WebView是一个比较常见的做法，因为不需要进行上下文切换，且应用可以对浏览器有较高的控制权，比如从其中取cookie或window的title。劣势是WebView通常不显示“可信任”网站标识，也不显示url，用户容易被钓鱼；并且WebView的cookie和history是独立的，这意味着用户每次授权都需要重新登录API提供商的账户。

使用系统自带的浏览器也有好有坏，好处是用户通常不需要重新登录API提供者账户，且安全性更高；坏处是用户在浏览器认证完成后需要通过my-mobile-app://oauth/callback这样的链接跳转回应用，如上所述，有可能跳到别的别有用心的应用里；并且系统浏览器的历史记录是不受应用控制的，在使用隐式授权方式时容易泄露token，特别是移动设备容易丢失和被盗的情况下。

一些API提供商提供了对于原生应用授权的友好支持，比如Facebook就提供了安卓和iOS的SDK用于用户授权。在安卓系统中，可以调用Facebook.authorize()来呼起授权请求，用户同意后，再调用Facebook.getAccessToken()获取调用对应API的access token。

## OpenID Connect认证

### 背景
几乎所有应用都会要求用户创建一个账户用于登录。然而注册过程通常比较繁琐，用户又经常会用同一个密码注册不同账户，账户安全容易受到威胁。OpenID就是为了实现用一个身份登录不同的应用。使用OpenID时，用户和应用都是信任身份提供者的（比如Google、Facebook），允许他们存储用户资料并代表应用验证用户身份。这种机制不仅免除了应用自建一套账户体系的麻烦，还方便了用户登录和使用各种应用。


### OpenID Connect
OpenID Connect是OpenID的下一代，它包含了以下两个考虑：
1. 允许访问用户身份信息与允许访问用户数据类似，开发者不需要针对这两种场景使用不同的协议；
2. 规范应当与是模块化的 —— 兼容上一个OpenID版本，包括automated discovery, associations等特性。

## ID Token
ID Token代表一个已经被授权的用户信息，在授权流程中用来查询用户资料或者其他用户数据。这个ID是一个JSON Web Token，通常代表被签名或/和加密过的用户身份信息。相比与通过加密方式验证其有效性，将其作为一个非直接的key传送给Check ID服务来解释更符合OAuth 2.0的特性，也是其相比与之前的版本的优势所在。

## 安全问题
虽然认证流程与OAuth的授权流程类似，但其所面临的安全问题却是不同的，比如说重放攻击（Replay attacks）：

- 攻击者拿到用户的登录一个站点的保密信息后，重新登录相同的站点；
- 别有用心的开发者拿到用户信息后，假装用户身份登录另一个应用。

针对第一种攻击，OAuth 2.0 要求使用SSL/TLS阻止消息泄露。针对第二种攻击，需要OpenID Connect提供一种特别的解决方法，就是使用Check ID endpoint。该终端用来验证OAuth provider提供的用户身份信息给了正确的应用。

如果应用使用的是服务端应用授权方式，那么浏览器只会收到一个auth code，然后再由服务器去换access token和identity token。因为需要提供相应的client id和secret，自然可以避免使用发给另外一个app的authorization code的问题。

如果应用使用的是客户端授权方式，那么access token和identity token就会直接发给浏览器。通常浏览器会将其发回后端服务器以验证这个登录用户的身份，这种情况下，服务器就必须通过解密ID Token或者请求Check ID endpoint的方式来验证了此身份信息是否发给正确应用了。这叫做“verifying the audience” of the token。

## 获取用户授权
通过OpenID Connect认证用户的过程与用OAuth 2.0 获取任何API授权的过程几乎一致。既可以使用服务端方式，也可以使用客户端方式。不论使用哪种方式，应用都会将用户定向到Auth提供商的授权页面，并带上如下参数：

- client_id
- redirect_uri
- scope：基础的OpenID Connect请求是“openid”，如果需要别的信息需指明，如email、address等
- response_type：使用值'id_token'表示需要Auth服务返回一个id_token，此外需同时提供“token”或“code”
- nonce：一个随机字符串，用来防止重放和CSRF攻击，在ID token请求返回中也会原样返回

用户同意授权后，会被重定向到redirect_uri，同时返回access token（用于请求UserInfo Endpoint获取用户资料）和id_token（用于请求Check ID Endpoint获取用户身份信息）。

## Check ID Endpoint
Check ID Endpoint是用来验证id_token的有效性，以确保它是给某一个应用使用的，同时用于client开始一个已认证身份的session。正如上面所说，当使用客户端授权时这个验证是十分必要的，避免重放攻击。如果没有错误，会返回参数：

- iss：user_id有效的域名
- user_id：代表iss域名下已认证的用户的身份的值
- aud：需要验证这个值是否和获取id_token的请求中所用的client_id相同
- expires_in：有效时间
- nonce：同样需要验证是否和获取id_token的请求中所用的值相同

## UserInfo Endpoint
Check ID Endpoint只会返回一个user_id，如果需要更多用户信息，就需要请求UserIndo Endpoint了。UserInfo Endpoint是一个标准的OAuth-授权 REST API。与别的API调用一样，可以将access token放在Authorization Header中。请求成功后，会以JSON格式返回用户的资料。