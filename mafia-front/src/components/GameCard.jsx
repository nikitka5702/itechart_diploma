import React, { Component, Fragment } from 'react'
import gql from 'graphql-tag'
import { ApolloConsumer, Mutation } from 'react-apollo'
import Moment from 'react-moment'

const GET_USER = gql`
query {
  me {
    id
  }
}`

const DELETE_GAME = gql`
mutation DeleteGame($id: Int!) {
  deleteGame(id: $id) {
    result
  }
}`

export default class GameCard extends Component {
  state = {
    id: undefined,
    fetch: true
  }

  setUserId = (id) => this.setState({id, fetch: false}) 

  render() {
    const obj = this.props.obj
    const mode = obj.extended ? 'Extended' : 'Classic'
    
    const delGame = this.state.id === obj.creator.id ? (
      <Mutation mutation={DELETE_GAME}>
        {(deleteGame, { data }) => {
          const f = (e) => {deleteGame({ variables: {id: obj.id } }); this.props.refetch();}
          return (
            <a href="#" onClick={f}>Delete</a>
          )
        }}
      </Mutation>
    ) : (
      <Fragment />
    )
    console.log(delGame)
    return (
      <div className="card">
        <div className="card-content">
          <span className="card-title">{obj.name}</span>
          {mode}<br/>
          Creator: {obj.creator.username}<br/>
          Created at: <Moment>{obj.createdAt}</Moment>
        </div>
        <div className="card-action">
          <ApolloConsumer>
            {client => {
              if (this.state.fetch) {
                client.query({
                  query: GET_USER
                }).then(d => {
                  this.setUserId(d.data.me.id)
                })
              }
              return (
                <Fragment>
                  <a href="#">Join</a>
                  {delGame}
                </Fragment>
              )
            }}
          </ApolloConsumer>
        </div>
      </div>
    )
  }
}
