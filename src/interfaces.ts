export interface linkObj {
    label: string,
    link: string,
    component: JSX.Element,
}

export interface ContentItemInterface {
    link: string,
    title: string,
    img: string,
    abstract: string,
    showInIndex?: boolean
}

export interface ContentCategoryInterface {
    category: string,
    articles: ContentItemInterface[]
}