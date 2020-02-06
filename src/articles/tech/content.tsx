import { ContentCategoryInterface } from 'interfaces'

export const content: ContentCategoryInterface[] = [{
    category: '前端',
    articles: [
    {
        link: '/tech/oauth',
        title: '开放平台 - Getting Started with OAuth 2.0 学习总结',
        abstract: '本文是OAuth 2.0的学习总结，主要是对Ryan Boyd的书《Getting Started with OAuth 2.0》重点内容进行翻译，并加上了自己的一些理解和总结。',
        img: 'img/number1.png',
        showInIndex: true,
    }, {
        link: '/tech/program_languages_features',
        title: '从JS的三个特性谈计算机语言发展',
        abstract: 'JavaScript 语言是一门“面向对象”、“函数式编程”的“动态”语言。本文就基于这三个特性出发，介绍了语言发展的历程，希望帮助读者对不同的计算机语言有更系统的认识。',
        img: 'img/number2.png',
        showInIndex: true,
    }]
}]