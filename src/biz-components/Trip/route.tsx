import * as React from 'react'
import {
    Link,
    Route,
} from "react-router-dom";
import Index from './Index'

export const LinkComponent = (
    <Link to="/trip">Trips</Link>
)

export const RouteComponent = (
    <Route path="/trip" component={Index}></Route>
)