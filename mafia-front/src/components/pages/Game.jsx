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


export default class Game extends Component {
  playerId;
  gameId = 1;

  mediaConstraints = {
    audio: true,
    video: true
  };

  peerConnections = {};

  constructor(props) {
    super(props);
    this.playerCardRefs = {};
    for(let i = 0; i < 10; i++) { 
      this.playerCardRefs[i] = { ref: React.createRef() };
    }

    this.signalingSocket = new WebSocket('ws://localhost:8000/ws/game/');

    this.signalingSocket.addEventListener('message', (event) => {
      let msg = JSON.parse(event.data)
      console.log(msg)
      switch(msg.type) {
        case 'player-joined':
          this.videoHandlePlayerJoinedMsg(msg);
          break;
        case 'player-disconnected':
          this.videoHandlePlayerDisconnectedMsg(msg);
          break;
        case 'video-offer':
          this.videoHandleVideoOfferMsg(msg);
          break;
        case 'video-answer':
          this.videoHandleVideoAnswerMsg(msg);
          break;
        case 'new-ice-candidate':
          this.videoHandleNewICECandidateMsg(msg);
          break;
        
        default:
      }
    });

    this.signalingSocket.addEventListener('open', (event) => {
      client
        .query({
          query: GET_MY_ID_QUERY,
        })
        .then((obj) => { 
          this.playerId = parseInt(obj.data.me.id);

          this.videoSendToServer({
            type: 'player-joined',
            game_id: this.gameId,
            player_id: this.playerId
          });
        });

      let cardRefs = this.playerCardRefs;
      navigator.mediaDevices.getUserMedia(this.mediaConstraints)
        .then((localStream) => {
          cardRefs[this.playerId].ref.current.videoRef.current.srcObject = localStream;
          cardRefs[this.playerId].ref.current.videoRef.current.muted = true;
        })
        .catch(this.videoHandleGetUserMediaError);
    });
  }

  videoHandlePlayerJoinedMsg = (msg) => {
    this.videoCreatePeerConnection(msg.player_id);
    navigator.mediaDevices.getUserMedia(this.mediaConstraints)
      .then((localStream) => {
        localStream.getTracks().forEach(track => this.peerConnections[msg.player_id].addTrack(track, localStream));
      })
      .catch(this.videoHandleGetUserMediaError);
  }

  videoHandlePlayerDisconnectedMsg = (msg) => {
    this.videoEndVideoStreaming(msg.player_id);
  }

  videoHandleVideoOfferMsg = (msg) => {
    if (this.peerConnections[msg.player_id]) {
      console.error('peerConnection already exists!');
      return;
    }
  
    var localStream = null;
    this.videoCreatePeerConnection(msg.player_id);
    this.peerConnections[msg.player_id].onnegotiationneeded = null;
  
    var desc = new RTCSessionDescription(msg.sdp);
  
    this.peerConnections[msg.player_id].setRemoteDescription(desc).then(() => {
      return navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    })
    .then((stream) => {
      localStream = stream;
      localStream.getTracks().forEach(track => this.peerConnections[msg.player_id].addTrack(track, localStream));
    })
    .then(() => {
      return this.peerConnections[msg.player_id].createAnswer();
    })
    .then((answer) => {
      return this.peerConnections[msg.player_id].setLocalDescription(answer);
    })
    .then(() => {
      this.videoSendToServer({
        type: 'video-answer',
        game_id: msg.game_id,
        player_id: this.playerId,
        target_id: msg.player_id,
        sdp: this.peerConnections[msg.player_id].localDescription
      });
    })
    .catch(this.videoHandleGetUserMediaError);
  }  

  videoHandleVideoAnswerMsg = (msg) => {
    var desc = new RTCSessionDescription(msg.sdp);
    this.peerConnections[msg.player_id].setRemoteDescription(desc)
      .then(() => {
        console.log('setRemoteDescription(answer) succsess in promise');
      })
      .catch(this.videoHandleError);
  }

  videoHandleNewICECandidateMsg = (msg) => {
    var candidate = new RTCIceCandidate(msg.candidate);
  
    this.peerConnections[msg.player_id].addIceCandidate(candidate)
      .then(() => {
        console.log('addIceCandidate(candidate) success in promise');
      })
      .catch(this.videoHandleError);
  }

  videoCreatePeerConnection = (targetId) => {
    console.log('creating new peer');
  
    let peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun3.l.google.com:19302'
          }
        ]
    });
    
    peerConnection.onicecandidate = (event) => {
      return this.videoHandleICECandidateEvent(event, targetId);
    }
    peerConnection.ontrack = (event) => {
      return this.videoHandleTrackEvent(event, targetId); 
    }
    peerConnection.onnegotiationneeded = () => {
      return this.videoHandleNegotiationNeededEvent(targetId);
    }
    
    this.peerConnections[targetId] = peerConnection;
  }

  videoHandleICECandidateEvent = (event, targetId) => {
    console.log('videoHandleICECandidateEvent triggered')
    if (event.candidate) {
      this.videoSendToServer({
        type: 'new-ice-candidate',
        game_id: this.gameId,
        player_id: this.playerId,
        target_id: targetId,
        candidate: event.candidate
      });
    }
  }

  videoHandleNegotiationNeededEvent = (targetId) => {
    console.log('videoHandleNegotiationNeededEvent triggered');
    this.peerConnections[targetId].createOffer().then((offer) => {
      return this.peerConnections[targetId].setLocalDescription(offer);
    })
    .then(() => {
      this.videoSendToServer({
        type: 'video-offer',
        game_id: this.gameId,
        player_id: this.playerId,
        target_id: targetId,
        sdp: this.peerConnections[targetId].localDescription
      });
    })
    .catch(this.videoHandleError);
  }

  videoHandleTrackEvent = (event, playerId) => {
    console.log('videoHandleTrackEvent triggered')
    document.getElementById('video-'.concat(playerId)).srcObject = event.streams[0];
  }

  videoEndVideoStreaming = (playerId) => {
    let playerVideo = document.getElementById("video-" + playerId);
  
    if (playerVideo.srcObject) {
      playerVideo.srcObject.getTracks().forEach(track => track.stop());
    }
  
    this.peerConnections[playerId].close()
    delete this.peerConnections[playerId];
  }

  videoSendToServer = (msg) => {
    this.signalingSocket.send(JSON.stringify(msg));
  }

  videoHandleGetUserMediaError = (error) => {
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

  videoHandleError = (error) => {
    console.error('Error ' + error.name + ': ' + error.message);
  }

  componentWillUnmount() {
    if (this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.onclose = () => {}
      this.signalingSocket.close()
    }
  }

  testGetPeers = () => {
    console.log(this.peerConnections)
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
                <button className='btn waves-effect waves-light' onClick={this.testGetPeers}>Get peers</button>
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

