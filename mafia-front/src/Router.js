import React from 'react'
import { Route, Switch } from 'react-router-dom'

import Index from './components/pages/Index'
import Login from './components/pages/Login'
import Profile from './components/pages/Profile'
import Games from './components/pages/Games'

const Router = props => {
  return (
    <Switch>
      <Route exact path='/' component={Index} />
      <Route path='/login' component={Login} />
      <Route path='/profile' component={Profile} />
      <Route path='/games' component={Games} />
    </Switch>
  )
}

export default Router
