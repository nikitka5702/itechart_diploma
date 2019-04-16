import React, { Component, Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { withRouter } from 'react-router'

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

class Header extends Component {
  render() {
    const isAuthenticated = Boolean(localStorage.getItem('token'))
    const auth = isAuthenticated ? 'logout' : 'login'
    return (
      <Fragment>
        <nav>
          <div className="nav-wrapper">
            <NavLink className="brand-logo" to="/">Mafia</NavLink>
            <a href="#!" data-target="mobile" className="sidenav-trigger"><i className="material-icons">menu</i></a>
            <ul className="right hide-on-med-and-down">
              <li><NavLink to={auth}>{capitalize(auth)}</NavLink></li>
            </ul>
          </div>
        </nav>
        <ul className="sidenav" id="mobile">
          <li><NavLink to={auth}>{capitalize(auth)}</NavLink></li>
        </ul>
      </Fragment>
    )
  }
}

export default withRouter(Header)
