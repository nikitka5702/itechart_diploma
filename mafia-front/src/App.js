import React, { Component, Fragment } from 'react';

// import 'materialize-css/dist/css/materialize.min.css'
// import 'materialize-css/dist/js/materialize'

import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Router from './Router'

import './App.css'

class App extends Component {
  render() {
    return (
      <Fragment>
        <header>
          <Header />
        </header>
        <main>
          <Router {...this.props} />
        </main>
        <footer className="page-footer">
          <Footer />
        </footer>
      </Fragment>
    );
  }
}

export default App;
