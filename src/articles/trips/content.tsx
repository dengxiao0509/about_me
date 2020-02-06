import { ContentCategoryInterface } from 'interfaces'

export const content: ContentCategoryInterface[] = [{
    category: '旅行记录',
    articles: [
    {
        link: '/trip/tibet',
        title: '高原之行',
        abstract: '探索神秘西藏',
        img: 'img/2.jpeg',
        showInIndex: true,
    }, {
        link: '/trip/japan',
        title: '岛国之旅',
        abstract: '小而精致的国家',
        img: 'img/3.jpeg',
        showInIndex: true,
    }]
}]