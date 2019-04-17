import React, { Component } from 'react'

export default class PlayerCard extends Component {
  render() {
    return (
      <div className="card  center">
        <span className="card-title">Game State</span>
        <div className="card-content">
          <p>Alert</p>
          <p>Info</p>
          <p>Other functionality</p>
        </div>
      </div>
    )
  }
}