import React, { Component } from 'react'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'

const STATISTICS = gql`
query {
  statistic {
    user {
      username
    }
    gamesCount
    gamesWon
    gamesLost
    asMafia
    asCitizen
    asSheriff
    asDoctor
  }
}`

export default class Profile extends Component {
  render() {
    return (
      <div className="row">
        <div className="col s8 offset-s2">
          <Query query={STATISTICS}>
            {({ loading, error, data }) => {
              if (loading) return (
                <div className="progress">
                  <div className="indeterminate"></div>
                </div>
              )
              if (error) return (
                `Error! ${error.message}`
              )

              data = data.statistic

              return (
                <div className="card">
                  <div className="card-content">
                    <span className="card-title"><b>{data.user.username}</b></span>
                    <ul className="collection">
                      <li className="collection-item"><span className="badge">{data.gamesCount}</span>Games</li>
                      <li className="collection-item"><span className="badge">{data.gamesWon}</span>Wins</li>
                      <li className="collection-item"><span className="badge">{data.gamesLost}</span>Loses</li>
                      <li className="collection-item"><center><b>Classic</b></center></li>
                      <li className="collection-item"><span className="badge">{data.asMafia}</span>Games as Mafia</li>
                      <li className="collection-item"><span className="badge">{data.asCitizen}</span>Games as Citizen</li>
                      <li className="collection-item"><center><b>Extended</b></center></li>
                      <li className="collection-item"><span className="badge">{data.asSheriff}</span>Games as Sheriff</li>
                      <li className="collection-item"><span className="badge">{data.asDoctor}</span>Games as Doctor</li>
                    </ul>
                  </div>
                </div>
              )
            }}
          </Query>
        </div>
      </div>
    )
  }
}
