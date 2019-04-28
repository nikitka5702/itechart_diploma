import React, { Component } from 'react'
import player_hidden_image from '../../images/player_hidden.png';
import './PlayerCard.css';

const videoStyle = {
  maxWidth: '100%',
};

export default class PlayerCard extends Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
  }

  render() {
    return (
      <div className="card">
        <div className="card-contents">
          <span className="player-name">Player name</span>
          <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">priority_high</i></button>
          <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">search</i></button>
          <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">smoking_rooms</i></button>
        </div>
        <div className="container-video">
          <video id={"video-" + this.props.card_id} ref={this.videoRef} style={videoStyle} poster={player_hidden_image} autoPlay></video>
        </div>
      </div>
    )
  }
}
