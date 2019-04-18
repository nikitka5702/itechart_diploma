import React, { Component, Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { withRouter } from 'react-router'

class Header extends Component {
  render() {
    const isAuthenticated = Boolean(localStorage.getItem('token'))
    const auth = 
      isAuthenticated ? 
      (
        <Fragment>
          <li><NavLink to="profile">Profile</NavLink></li>
          <li><a href="#" onClick={(e) => {localStorage.removeItem('token'); this.props.history.push('/')}}>Logout</a></li>
        </Fragment>
      ) : (
        <Fragment>
          <li><NavLink to="login">Login</NavLink></li>
          <li><NavLink to="reg">Register</NavLink></li>
        </Fragment>
      )
    return (
      <Fragment>
        <nav>
          <div className="nav-wrapper">
            <NavLink className="brand-logo" to="/">Mafia</NavLink>
            <a href="#!" data-target="mobile" className="sidenav-trigger"><i className="material-icons">menu</i></a>
            <ul className="right hide-on-med-and-down">
              {auth}
            </ul>
          </div>
        </nav>
        <ul className="sidenav" id="mobile">
          {auth}
        </ul>
      </Fragment>
    )
  }
}

export default withRouter(Header)
