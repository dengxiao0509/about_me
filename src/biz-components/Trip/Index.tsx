import * as React from 'react'
import ArticleList from 'components/ArticleList'
import { content as techContent } from 'articles/trips/content'

const Trips = () => {
    return (
        <div className="trip-content">
            <ArticleList content={techContent} articleGroupTitle="业余旅行家" hideImage={false} hideMoreBtn={true}></ArticleList>
        </div>
    )
}

export default Trips
