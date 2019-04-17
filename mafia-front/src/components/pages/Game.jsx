import React, { Component } from 'react'
import PlayerCard from '../elements/PlayerCard'
import CentralCard from '../elements/CentralCard'
import './Game.css'

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
            <CentralCard />
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
