import * as React from 'react'
import {
    Link,
    Route,
} from "react-router-dom";
import Index from './Index'

export const LinkComponent = (
    <Link to='/tech'>Techs</Link>
)

export const RouteComponent = (
    <Route path="/tech/:title" component={Index} />
)