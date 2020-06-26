import * as React from 'react'
import { ContentCategoryInterface, ContentItemInterface } from 'interfaces'
import { Row, Col } from 'antd'
import config from 'config/base'

interface ArticleListPropsInterface {
    articleGroupTitle: string,
    hideMoreBtn?: boolean,
    hideImage?: boolean,
    content: ContentCategoryInterface[],
}

const ArticleList = (props: ArticleListPropsInterface) => {
    const { articleGroupTitle = '', content = [], hideMoreBtn = false, hideImage = false  } = props
    const getArticles = () => {
        const res: ContentItemInterface[] = []
        content.forEach(cat => {
            cat.articles.forEach(article => {
                if (article.showInIndex) {
                    res.push(article)
                }
            })
        })
        return res
    }
    return (
        <div className="container">
            <Row type="flex" justify="center">
                <div className="nav-list">
                    <div className="article-group-title"><h2>{articleGroupTitle}</h2></div>
                    {
                        getArticles().map(article => {
                            return (
                                <Col span={hideMoreBtn ? 24 : 12}>
                                    <a href={`${config.appRootUrl}/${article.link}`}>
                                        <div className="article-card">
                                            <Row>
                                                {
                                                    !hideImage ? (
                                                        <Col span={8}>
                                                            <div className="article-img">
                                                                <img src={`${config.appRootUrl}/${article.img}`} />
                                                            </div>
                                                        </Col>
                                                    ) : null
                                                }
                                                <Col span={hideImage ? 24 : 16}>
                                                    <div className={`article-meta text-left ${ hideMoreBtn ? 'full-width' : ''}`}>
                                                        <h2>{article.title}</h2>
                                                        <p>{article.abstract}</p>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </a>
                                </Col>
                            )
                        })
                    }
                </div>                
            </Row>
            {
                !hideMoreBtn ? (
                    <Row type="flex" justify="center">
                        <Col span={4}><a href="/tech" className="more-btn">More Articles</a></Col>
                    </Row>
                ) : null
            }
        </div>
    )
}

export default ArticleList
