import React, { Component } from 'react'
import PlayerCard from '../elements/PlayerCard'

export default class Game extends Component {
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
        </div>
        <div className="row valign-wrapper">
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s6">
            <div className="card center">
              <span className="card-title">Game State</span>
              <div className="card-content">
                <p>Alert</p>
                <p>Info</p>
                <p>Other functionality</p>
              </div>
            </div>
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
        </div>
        <div className="row">
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
          <div className="col s3">
            <PlayerCard />
          </div>
        </div>
      </div>
    )
  }
}
