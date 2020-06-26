import { ContentCategoryInterface } from 'interfaces'

export const content: ContentCategoryInterface[] = [{
    category: '前端',
    articles: [
        {
            link: '/tech/program_languages_features',
            title: '从JS的三个特性谈计算机语言发展',
            abstract: 'JavaScript 语言是一门“面向对象”、“函数式编程”的“动态”语言。本文就基于这三个特性出发，介绍了语言发展的历程，希望帮助读者对不同的计算机语言有更系统的认识。',
            img: 'img/number1.png',
            showInIndex: true,
        }, {
            link: '/tech/chrome_browser',
            title: 'Chrome是怎么工作的',
            abstract: '本文主要介绍了 Chrome 的多进程结构，并结合页面渲染流程讲解了各个进程的作用。最后，简单总结了这一过程。可以帮助大家更清晰地了解从输入URL到看到Web页面中间发生了什么。',
            img: 'img/number2.png',
            showInIndex: true,
        },
        {
            link: '/tech/mvc_mvvm_mvp_flux',
            title: 'MV*与Flux模式简析',
            abstract: '本文介绍并对比了 MVC、MVP、MVVM 几种框架模型，并以 Flux、React、Redux、Elm、Mbox、Reactive Programming 等举例分析其模型实质。',
            img: 'img/number3.png',
            showInIndex: true,
        }
    ]
}, {
    category: '网络协议',
    articles: [
        {
            link: '/tech/tcp',
            title: 'TCP协议介绍',
            abstract: '本文介绍了 TCP 这一面向连接、可靠的、基于字节流的运输层协议，通过对协议头、通信过程中的三次握手和四次挥手过程的详细介绍，说明了这三个特性各自的实现方式及意义。最后，还与非连接的 UDP 协议做了对比。通过阅读此文，相信您可以对TCP协议有比较全面的认识。',
            img: '',
            showInIndex: false,
        }, 
        {
            link: '/tech/http_https',
            title: 'HTTP/1.0  /1.1  /2.0 及 HTTPS 介绍和比较',
            abstract: '本文先比较了 HTTP 协议的 1.0、1.1、2.0 版本的异同，介绍了 HTTP 协议的发展。后部分介绍了基于 HTTP + SSL/TLS 的 HTTPS协议，梳理了应用层协议 HTTP 的发展。',
            img: 'img/number4.png',
            showInIndex: true,
        }, 
        {
            link: '/tech/oauth',
            title: 'Getting Started with OAuth 2.0 学习总结',
            abstract: '本文是OAuth 2.0的学习总结，主要是对Ryan Boyd的书《Getting Started with OAuth 2.0》重点内容进行翻译，并加上了自己的一些理解和总结。',
            img: '',
            showInIndex: false,
        }, 
    ]
}]