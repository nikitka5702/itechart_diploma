import React, { Component } from 'react'
import PlayerCard from '../elements/PlayerCard'
import { ClimbingBoxLoader, BarLoader, BeatLoader, BounceLoader,
CircleLoader, ClipLoader, DotLoader, FadeLoader, GridLoader,
HashLoader, MoonLoader, PacmanLoader, PropagateLoader,
PulseLoader, ReactSpinners, RingLoader, RiseLoader,
RotateLoader, ScaleLoader, SyncLoader } from 'react-spinners'
import {gql} from "apollo-boost";
import { Mutation } from 'react-apollo'

const mutation = gql`
mutation CreateGamePlayer($gameId: Int!) {
  createGamePlayer(gameId: $gameId) {
    gamePlayer {
      token
    }
  }
}`

export default class Game extends Component {
  state = {
    isLoading: true,
    gameState: 'connecting',
    mutationHasDone: false,
    token: undefined,
    playerNames: undefined
  }

  socket = undefined

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return true
  }
  render() {
    if (this.state.playerNames === undefined)
    {
      let defaultNamesArray = []
      for (let i = 0; i < 10; i++)
        defaultNamesArray.push('loading')
      this.state.playerNames = defaultNamesArray
    }
    const loaders = [ClimbingBoxLoader, BarLoader, BeatLoader, BounceLoader,
                     CircleLoader, ClipLoader, DotLoader, FadeLoader, GridLoader,
                     HashLoader, MoonLoader, PacmanLoader, PropagateLoader,
                     PulseLoader, ReactSpinners, RingLoader, RiseLoader,
                     RotateLoader, ScaleLoader, SyncLoader]
    const randomLoader = loaders[Math.floor(Math.abs(Math.random() * 10)) % loaders.length]

    return (
      <div className="container">
        <Mutation mutation={mutation}
                  variables={{gameId: this.props.match.params.gameId}}
                  update={(cache, { data }) => {
                    this.setState({
                        gameState: "waiting players",
                        token: data.createGamePlayer.gamePlayer.token
                    })
                    this.socket = new WebSocket("ws://localhost:8000/gameAwait/");
                    this.socket.onopen = ev => {
                      let message = {
                        type: 'update info',
                        token: this.state.token
                      }
                      this.socket.send(JSON.stringify(message))
                    }
                    this.socket.onmessage = ev => {
                      let data = JSON.parse(ev.data)
                      console.log(data.players)
                      console.log()
                      for (let i = 0; i < data.players.length; i++)
                        this.state.playerNames[i]= data.players[i]
                      this.setState({}) // to update render
                    }
                  }}
        >
          {(createGamePlayer, {data}) => {
            if (!this.state.mutationHasDone)
            {
              this.setState({mutationHasDone: true})
              createGamePlayer()
            }
            return <div></div> //kostyl but i didnt found better idea
          }}

        </Mutation>
        <div className="row">
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[0]}/>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[1]}/>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[2]}/>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[3]}/>
          </div>
        </div>
        <div className="row valign-wrapper">
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[4]}/>
          </div>
          <div className="col s6">
            <div className="card center">
              <span className="card-title">{this.state.gameState}</span>
              <div style={{display: 'flex', justifyContent: 'center'}}>
                {React.createElement(randomLoader, {
                  size: 20, sizeUnit: 'px', color:'#1dbc98', loading: this.state.isLoading
                })}
              </div>
              <div className="card-content">
                <p>Alert</p>
                <p>Info</p>
                <p>Other functionality</p>
              </div>
            </div>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[5]}/>
          </div>
        </div>
        <div className="row">
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[6]}/>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[7]}/>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[8]}/>
          </div>
          <div className="col s3">
            <PlayerCard playerName={this.state.playerNames[9]}/>
          </div>
        </div>
      </div>
    )
  }
}
