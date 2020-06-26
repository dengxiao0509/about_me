import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../index.css';
// import * as serviceWorker from './serviceWorker';
import '../styles/css/index.less'
// import loadable from '@loadable/component'
// import pMinDelay from 'p-min-delay'
import { Row, Col } from 'antd'
import {
    Link,
} from "react-router-dom";
import { LinkComponent as TechLink, RouteComponent as TechRoute } from 'biz-components/Tech/route'
import { LinkComponent as TripLink, RouteComponent as TripRoute } from 'biz-components/Trip/route'
import { LinkComponent as CoverLink, RouteComponent as CoverRoute } from 'biz-components/Cover/route'

import { 
  BrowserRouter as Router,
  Switch,
  useLocation,
} from "react-router-dom";

// loading Navbar, delay 2s
// const NavBar = loadable(() => pMinDelay(import(/* webpackChunkName: "NavBar" */ './NavBar'), 2000), {
//   fallback: <div>Loading...</div>,
// })

function IndexContent () {
  const location = useLocation()
  return (
        //   <TransitionGroup>
        //     {/*
        //       This is no different than other usage of
        //       <CSSTransition>, just make sure to pass
        //       `location` to `Switch` so it can match
        //       the old location as it animates out.
        //     */}
        //     {/* While this component is meant for multiple Transition or CSSTransition children, 
        //         sometimes you may want to have a single transition child with content that you want to be transitioned out 
        //         and in when you change it (e.g. routes, images etc.) In that case you can change the key prop of the transition child as you change its content, 
        //         this will cause TransitionGroup to transition the child out and back in.
        //       */ 
        //     }
        //     <CSSTransition
        //       // key 是为了每次重新渲染的时候，重新卸载&加载component，才能触发transition效果
        //       // 此处只是子组件的content变了，Transition组件并没有变，所以需要用key强制重载
        //       // location.key - A unique string representing this location
        //       key={location.key}
        //       classNames="fade"
        //       timeout={300}
        //     >
              <Switch location={location}>
                  {TechRoute}
                  {TripRoute}
                  {CoverRoute}
              </Switch>
        //     </CSSTransition>
        //   </TransitionGroup>
  );
}

const App = () => {
    return (
        <div className="App">
            <Router>
              <Row type="flex" align="middle" className="nav">
                  <Col span={7} offset={1}>
                    <Link to={'/'} className="navbar-brand">
                      <img className="logo" src={`/img/logo.png`} width="50" />
                      <span>小世界</span>
                    </Link>
                  </Col>
                  <Col span={2} offset={10} className="nav-item">{TechLink}</Col>
                  <Col span={2} className="nav-item">{TripLink}</Col>
              </Row>
              <IndexContent />
              <footer className="container-fluid">
                <div className="container">
                  <Row type="flex" justify="center" align="middle">
                    <Col span={10} className="footer">
                      <span>© copy DENG Xiao All Rights Received. </span>
                    </Col>
                  </Row>
                </div>
              </footer>
            </Router>
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
