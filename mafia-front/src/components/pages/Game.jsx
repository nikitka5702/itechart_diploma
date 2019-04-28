import React, { Component } from 'react'
import gql from 'graphql-tag'
import { client } from '../../index.js'
import PlayerCard from '../elements/PlayerCard'

const GET_MY_ID_QUERY = gql`
query {
  me {
    id
  }
}`

var playerId;
var gameId = 1;

var mediaConstraints = {
  audio: true,
  video: true
};

var peerConnections = {};

const signalingSocket = new WebSocket('ws://localhost:8000/ws/game/');

signalingSocket.addEventListener('message', (event) => {
  let msg = JSON.parse(event.data)
  console.log(msg)
  switch(msg.type) {
    case 'player-joined':
      handlePlayerJoinedMsg(msg);
      break;
    case 'player-disconnected':
      handlePlayerDisconnectedMsg(msg);
      break;
    case 'video-offer':
      handleVideoOfferMsg(msg);
      break;
    case 'video-answer':
      handleVideoAnswerMsg(msg);
      break;
    case 'new-ice-candidate':
      handleNewICECandidateMsg(msg);
      break;
    
    default:
  }
});


var handlePlayerJoinedMsg = (msg) => {
  createPeerConnection(msg.player_id);
  navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(function(localStream) {
      localStream.getTracks().forEach(track => peerConnections[msg.player_id].addTrack(track, localStream));
    })
    .catch(handleGetUserMediaError);
}

var handlePlayerDisconnectedMsg = (msg) => {
  endVideoStreaming(msg.player_id);
}

var handleVideoOfferMsg = (msg) => {
  if (peerConnections[msg.player_id]) {
    console.error('peerConnection already exists!');
    return;
  }

  var localStream = null;
  createPeerConnection(msg.player_id);
  peerConnections[msg.player_id].onnegotiationneeded = null;

  var desc = new RTCSessionDescription(msg.sdp);

  peerConnections[msg.player_id].setRemoteDescription(desc).then(() => {
    return navigator.mediaDevices.getUserMedia(mediaConstraints);
  })
  .then((stream) => {
    localStream = stream;
    localStream.getTracks().forEach(track => peerConnections[msg.player_id].addTrack(track, localStream));
  })
  .then(() => {
    return peerConnections[msg.player_id].createAnswer();
  })
  .then((answer) => {
    return peerConnections[msg.player_id].setLocalDescription(answer);
  })
  .then(() => {
    sendToServer({
      type: 'video-answer',
      game_id: msg.game_id,
      player_id: playerId,
      target_id: msg.player_id,
      sdp: peerConnections[msg.player_id].localDescription
    });
  })
  .catch(handleGetUserMediaError);
}

var handleVideoAnswerMsg = (msg) => {
  var desc = new RTCSessionDescription(msg.sdp);
  peerConnections[msg.player_id].setRemoteDescription(desc)
    .then(() => {
      console.log('setRemoteDescription(answer) succsess in promise');
    })
    .catch(handleError);
}

var handleNewICECandidateMsg = (msg) => {
  var candidate = new RTCIceCandidate(msg.candidate);

  peerConnections[msg.player_id].addIceCandidate(candidate)
    .then(() => {
      console.log('addIceCandidate(candidate) success in promise');
    })
    .catch(handleError);
}


var createPeerConnection = (targetId) => {
  console.log('creating new peer');

  let peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun3.l.google.com:19302'
        }
      ]
  });
  
  peerConnection.onicecandidate = (event) => {
    return handleICECandidateEvent(event, targetId);
  }
  peerConnection.ontrack = (event) => {
    return handleTrackEvent(event, targetId); 
  }
  peerConnection.onnegotiationneeded = () => {
    return handleNegotiationNeededEvent(targetId);
  }
  
  peerConnections[targetId] = peerConnection;
}

var handleICECandidateEvent = (event, targetId) => {
  console.log('handleICECandidateEvent triggered')
  if (event.candidate) {
    sendToServer({
      type: 'new-ice-candidate',
      game_id: gameId,
      player_id: playerId,
      target_id: targetId,
      candidate: event.candidate
    });
  }
}

var handleNegotiationNeededEvent = (targetId) => {
  console.log('handleNegotiationNeededEvent triggered')
  peerConnections[targetId].createOffer().then((offer) => {
    return peerConnections[targetId].setLocalDescription(offer);
  })
  .then(function() {
    sendToServer({
      type: 'video-offer',
      game_id: gameId,
      player_id: playerId,
      target_id: targetId,
      sdp: peerConnections[targetId].localDescription
    });
  })
  .catch(handleError);
}

var handleTrackEvent = (event, playerId) => {
  console.log('handleTrackEvent triggered')
  document.getElementById('video-'.concat(playerId)).srcObject = event.streams[0];
}


var endVideoStreaming = (playerId) => {
  let playerVideo = document.getElementById("video-" + playerId);

  if (playerVideo.srcObject) {
    playerVideo.srcObject.getTracks().forEach(track => track.stop());
  }

  peerConnections[playerId].close()
  delete peerConnections[playerId];
}

var sendToServer = (msg) => {
  signalingSocket.send(JSON.stringify(msg));
}


var handleGetUserMediaError = (error) => {
  switch(error.name) {
    case 'NotFoundError':
      alert('Unable to open your call because no camera and/or microphone were found.');
      break;
    case 'SecurityError':
    case 'PermissionDeniedError':
      break;
    default:
      alert('Error opening your camera and/or microphone: ' + error.message);
      break;
  }
}

var handleError = (error) => {
  console.error('Error ' + error.name + ': ' + error.message);
}

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.playerCardRefs = {}; // tmp
    for(let i = 0; i < 10; i++) { 
      this.playerCardRefs[i] = { ref: React.createRef() };
    }


    client
    .query({
      query: GET_MY_ID_QUERY,
    })
    .then((obj) => { 
      playerId = parseInt(obj.data.me.id);

      sendToServer({
        type: 'player-joined',
        game_id: gameId,
        player_id: playerId
      });
    });

    let cardRefs = this.playerCardRefs;
    navigator.mediaDevices.getUserMedia(mediaConstraints)
      .then(function(localStream) {
        cardRefs[playerId].ref.current.videoRef.current.srcObject = localStream;
        cardRefs[playerId].ref.current.videoRef.current.muted = true;
      })
      .catch(handleGetUserMediaError);
  }

  test() {
    console.log(peerConnections)
  }

  render() {
    return (
      <div className='container'>
        <div className='row'>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[0].ref} card_id={0} />
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[1].ref} card_id={1} />
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[2].ref} card_id={2} />
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[3].ref} card_id={3} />
          </div>
        </div>
        <div className='row valign-wrapper'>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[4].ref} card_id={4} />
          </div>
          <div className='col s6'>
            <div className='card center'>
              <span className='card-title'>Game State</span>
              <div className='card-content'>
                <p>Alert</p>
                <p>Info</p>
                <p>Other functionality</p>
                <button className='btn waves-effect waves-light' onClick={this.test}>Test</button>
              </div>
            </div>
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[5].ref} card_id={5} />
          </div>
        </div>
        <div className='row'>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[6].ref} card_id={6} />
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[7].ref} card_id={7} />
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[8].ref} card_id={8} />
          </div>
          <div className='col s3'>
            <PlayerCard ref={this.playerCardRefs[9].ref} card_id={9} />
          </div>
        </div>
      </div>
    )
  }
}

