import * as React from 'react'
import {
    Link,
    Route,
} from "react-router-dom";
import Index from './Index'

export const LinkComponent = (
    <Link to="/article">Article</Link>
)

export const RouteComponent = (
    <Route path="/article" component={Index}></Route>
)