import React, { Component } from 'react'
import player_hidden_image from '../../images/player_hidden.png';
import './PlayerCard.css';

const videoStyle = {
  maxWidth: '100%',
};

const cardContentsStyle = {
  minHeight: '40px',
};

export default class PlayerCard extends Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.state = {checkPlayerButtonHidden: true, killPlayerButtonHidden: true, voteForPlayerButtonHidden: true};
  }

  render() {
    return (
      <div className="card">
        <div className="card-contents" style={cardContentsStyle}>
          <span className="player-name">Player name</span>
          {!this.state.voteForPlayerButtonHidden &&
            <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">priority_high</i></button>
          }
          {!this.state.checkPlayerButtonHidden &&
            <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">search</i></button>
          }
          {!this.state.killPlayerButtonHidden &&
            <button className="btn-floating right waves-effect waves-light red"><i className="material-icons">smoking_rooms</i></button>
          }
        </div>
        <div className="container-video">
          <video id={"video-" + this.props.card_id} ref={this.videoRef} style={videoStyle} poster={player_hidden_image} autoPlay></video>
        </div>
      </div>
    )
  }
}
