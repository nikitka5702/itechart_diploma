import React from 'react'
import { Route, Switch } from 'react-router-dom'

import Index from './components/pages/Index'
import Login from './components/pages/Login'

const Router = props => {
  return (
    <Switch>
      <Route exact path='/' component={Index} />
      <Route path='login' component={Login} />
    </Switch>
  )
}

export default Router
