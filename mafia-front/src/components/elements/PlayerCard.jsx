import React, { Component } from 'react'
import player_hidden_image from '../../images/player_hidden.png';
import './PlayerCard.css';


export default class PlayerCard extends Component {
  render() {
    return (
      <div className="card">
        <div className="card-contents">
          <span className="player-name">{this.props.playerName}</span>
          <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">priority_high</i></button>
          <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">search</i></button>
          <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">smoking_rooms</i></button>
        </div>
        <div className="container-video">
          <img className="responsive-img" src={player_hidden_image} alt="Hidden webcam"></img>
        </div>
      </div>
    )
  }
}
