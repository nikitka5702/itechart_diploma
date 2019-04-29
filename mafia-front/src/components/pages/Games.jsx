import React, { Component, Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { Formik, Form } from 'formik'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'

import MaterializeField from '../MaterializeField'
import GameCard from '../GameCard'

const GAMES = gql`
query Games($q: String, $first: Int, $skip: Int) {
  games(search: $q, first: $first, skip: $skip) {
    id
    creator {
      id
      username
    }
    name
    players
    peopleAsMafia
    peopleAsDoctor
    peopleAsSheriff
    extended
    createdAt
  }
}`

export default class Games extends Component {
  state = {
    q: '',
    first: 10,
    skip: 0,
    page: 1
  }

  setQuery = (q) => this.setState({q})

  nextPage = () => this.setState({first: this.state.first + 10, skip: this.state.skip + 10, page: this.state.page + 1})

  prevPage = () => {
    if (this.state.page > 1) {
      this.setState({first: this.state.first - 10, skip: this.state.skip - 10, page: this.state.page - 1})
    }
  }

  render() {
    return (
      <div className="content">
        <div className="col s8 offset-s2">
          <Formik
            initialValues={{q: ''}}
            onSubmit={(values, actions) => {
              const {q} = values
              this.setQuery(q)
            }}
            render={({ errors, status, touched, isSubmitting }) => (
              <Form>
                <div className="row">
                  <div className="col s8 offset-s2">
                    <div className="row">
                      <MaterializeField type="text" name="q" component="p" title="Search" prefix="search" />
                    </div>
                    <Query query={GAMES} variables={{q: this.state.q, first: this.state.first, skip: this.state.skip}}>
                      {({ loading, error, data, refetch }) => {
                        if (loading) return (
                          <div className="progress">
                            <div className="indeterminate"></div>
                          </div>
                        )
                        if (error) return (
                          `Error! ${error.message}`
                        )

                        data = data.games

                        return <Fragment>
                          <div className="row">
                            <NavLink to='createGame' className='btn'><i className="material-icons left">add</i>Create Game</NavLink>
                            <button className="btn" onClick={() => refetch()}><i className="material-icons left">refresh</i>Refresh</button>
                          </div>
                          {data.map((d, idx) => (
                            <div className="row" key={d.id}>
                              <GameCard obj={d} refetch={refetch} />
                            </div>
                          ))}
                        </Fragment>
                      }}
                    </Query>
                    <div className="row">
                      <ul className="pagination center-align">
                        <li className={this.state.page === 1 ? "disabled" : "enabled"}><a href="#!" onClick={(e) => this.prevPage()}><i className="material-icons">chevron_left</i></a></li>
                        <li className="active"><a href="#!">{this.state.page}</a></li>
                        <li className="waves-effect"><a href="#!" onClick={(e) => this.nextPage()}><i className="material-icons">chevron_right</i></a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Form>
            )}
          />
        </div>
      </div>
    )
  }
}
