import * as React from 'react'
import { Row, Col, Menu, Icon } from 'antd'
import { content } from 'articles/tech/content'
import {
    Link,
} from "react-router-dom"
const { SubMenu } = Menu

const Tech = (props: { match: { params: { title: string; }; }; }) => {
    const title = props.match.params.title
    const getMenuBar = () => {
        const res: JSX.Element[] = []
        content.forEach((cat, i) => {
            const articlesComponents: JSX.Element[] = []
            cat.articles.forEach((article, j) => {
                articlesComponents.push(
                    <Menu.Item key={`article_${i}_${j}}`}>
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
    return (
        <div className="tech-content">
            <Row>
                <Col span={4}>
                    <div className="side-nav">
                        <Menu
                            mode="inline"
                            onClick={handleMenuClick}
                            defaultSelectedKeys={[`article_${0}_${0}}`]}
                            defaultOpenKeys={['sub1']}
                        >
                            {getMenuBar()}
                        </Menu>
                    </div>
                </Col>
                <Col span={20}>
                    <div>{title}</div>
                    {/* <ArticleList content={techContent} articleGroupTitle="正经工程师" hideImage={true} hideMoreBtn={true}></ArticleList> */}
                </Col>
            </Row>
        </div>
    )
}

export default Tech
