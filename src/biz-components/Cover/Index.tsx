import * as React from 'react'
import './style.less'
import { Row, Col } from 'antd'
import { content as techContent } from 'articles/tech/content'
import { content as tripContent } from 'articles/trips/content'
import ArticleList from 'components/ArticleList'

const Cover = () => {
    return (
        <React.Fragment>
            <div className="cover-content">
                <div className="big-img-container">
                    <div className="big-img">
                        <img src="img/swiss.JPG" />
                    </div>
                </div>
                <Row type="flex" justify="end">
                    <Col span={18}>
                        <div className="hero-title">
                            <h1>Life is an adventure, enjoy it ;)</h1>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className="hero-meta">
                            <p>热爱探索，喜欢新奇，活力满满的21世纪新程序员</p>
                            <div className="author">
                                <div className="author-img">
                                    <img src="img/portal.JPG" />
                                </div>
                                <div className="author-meta">
                                    <span className="author-name">Xiao</span>
                                    <span className="author-tag">Web Frontend Coder</span>
                                </div>	
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
            <ArticleList content={techContent} articleGroupTitle="正经工程师"></ArticleList>
            <ArticleList content={tripContent} articleGroupTitle="业务旅行家"></ArticleList>
        </React.Fragment>
    )
}

export default React.memo(Cover)
