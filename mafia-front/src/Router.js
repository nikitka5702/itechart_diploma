import React from 'react'
import { Route, Switch } from 'react-router-dom'

import Index from './components/pages/Index'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import Profile from './components/pages/Profile'
import Games from './components/pages/Games'
import Game from './components/pages/Game'
import CreateGame from './components/pages/CreateGame'
import WaitGame from './components/pages/WaitGame'

const Router = props => {
  return (
    <Switch>
      <Route exact path='/' component={Index} />
      <Route path='/login' component={Login} />
      <Route path='/reg' component={Register} />
      <Route path='/profile' component={Profile} />
      <Route path='/games' component={Games} />
      <Route path='/game' component={Game} />
      <Route path='/createGame' component={CreateGame} />
      <Route path='/waitPage' component={WaitGame} />
    </Switch>
  )
}

export default Router
