import * as React from 'react'
import { Row, Col, Menu, Icon } from 'antd'
import { content } from 'articles/tech/content'
import {
    Link,
} from "react-router-dom"
const { SubMenu } = Menu

const Tech = (props: { match: { params: { title: string; }; }; }) => {
    const title = props.match.params.title || content[0].articles[0].link.replace('/tech/', '')
    const getMenuBar = () => {
        const res: JSX.Element[] = []
        content.forEach((cat, i) => {
            const articlesComponents: JSX.Element[] = []
            cat.articles.forEach((article, j) => {
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

    console.log('render')
    const articleHtml = require(`articles/tech/${title}.md`)
    return (
        <div className="tech-content">
            <Row>
                <Col span={5}>
                    <div className="side-nav">
                        <Menu
                            mode="inline"
                            onClick={handleMenuClick}
                            defaultSelectedKeys={[`article_0_0`]}
                            defaultOpenKeys={['cat_0']}
                        >
                            {getMenuBar()}
                        </Menu>
                    </div>
                </Col>
                <Col span={19} className="article-content">
                    <div dangerouslySetInnerHTML={{__html: articleHtml}}></div>
                    {/* <ArticleList content={techContent} articleGroupTitle="正经工程师" hideImage={true} hideMoreBtn={true}></ArticleList> */}
                </Col>
            </Row>
        </div>
    )
}

export default React.memo(Tech)
