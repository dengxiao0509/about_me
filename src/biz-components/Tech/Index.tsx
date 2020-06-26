import * as React from 'react'
import { Row, Col, Menu, Icon } from 'antd'
import { content } from 'articles/tech/content'
import {
    Link,
} from "react-router-dom"
import {
    ContentCategoryInterface
} from 'interfaces'
const { SubMenu } = Menu
const {
    useState,
    useEffect
} = React

const findArticleIndex = (data: Array<ContentCategoryInterface>, title: string) => {
    let subIndex = 0
    let index = data.findIndex(cat => {
        subIndex = cat.articles.findIndex(article => article.link.split('/').pop() === title)
        return subIndex > -1
    })
    index = index === -1 ? 0 : index
    return `article_${index}_${subIndex}`
}
const Tech = (props: { match: { params: { title: string; }; }; }) => {
    const [selectedKeys, setSelectedKeys] = useState(['article_0_0'])
    const title = props.match.params.title || content[0].articles[0].link.replace('/tech/', '')

    useEffect(() => {
        setSelectedKeys([findArticleIndex(content, title)])
        console.log('setSelectedArticle', findArticleIndex(content, title))
    }, [title])
   
    const getMenuBar = () => {
        const res: JSX.Element[] = []
        content.forEach((cat, i) => {
            const articlesComponents: JSX.Element[] = []
            cat.articles.forEach((article, j) => {
                console.log(`article_${i}_${j}`)
                articlesComponents.push(
                    <Menu.Item key={`article_${i}_${j}`}>
                        <Link to={article.link}>
                            {article.title}
                        </Link>
                    </Menu.Item>
                )
            })
            res.push(
                <SubMenu
                    key={`cat_${i}`}
                    title={
                        <span>
                            <Icon type="appstore" />
                            <span>{cat.category}</span>
                        </span>
                    }
                >
                    {articlesComponents}
                </SubMenu>
            )
        })
        return res
    }

    const handleMenuClick = (e: any) => {
        console.log(e)
    }

    const MenuBarContent = getMenuBar()
    const articleHtml = require(`articles/tech/${title}.md`)
    console.log('render', selectedKeys)
    return (
        <div className="tech-content">
            <Row>
                <Col span={6}>
                    <div className="side-nav">
                        <Menu
                            mode="inline"
                            onClick={handleMenuClick}
                            selectedKeys={selectedKeys}
                            defaultOpenKeys={['cat_0', 'cat_1']}
                            inlineIndent={14}
                        >
                            {MenuBarContent}
                        </Menu>
                    </div>
                </Col>
                <Col span={18} className="article-content">
                    <div dangerouslySetInnerHTML={{__html: articleHtml}}></div>
                    {/* <ArticleList content={techContent} articleGroupTitle="正经工程师" hideImage={true} hideMoreBtn={true}></ArticleList> */}
                </Col>
            </Row>
        </div>
    )
}

export default React.memo(Tech)
