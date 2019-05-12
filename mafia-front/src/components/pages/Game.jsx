import React, { Component } from 'react'
import gql from 'graphql-tag'
import { client } from '../../index.js'
import PlayerCard from '../elements/PlayerCard'
import { ClimbingBoxLoader, BarLoader, BeatLoader, BounceLoader,
CircleLoader, ClipLoader, DotLoader, FadeLoader, GridLoader,
HashLoader, MoonLoader, PacmanLoader, PropagateLoader,
PulseLoader, ReactSpinners, RingLoader, RiseLoader,
RotateLoader, ScaleLoader, SyncLoader } from 'react-spinners'
//import {gql} from "apollo-boost";
import { Mutation } from 'react-apollo'

const mutation = gql`
mutation CreateGamePlayer($gameId: Int!) {
  createGamePlayer(gameId: $gameId) {
    gamePlayer {
      token
    }
  }
}`


const rowStyle = {
  marginBottom: 0
};

const GET_MY_ID_QUERY = gql`
query {
  me {
    id
  }
}`


export default class Game extends Component {
  state = {
    isLoading: true,
    gameState: 'connecting',
    mutationHasDone: false,
    token: undefined,
    playerNames: undefined,
    playerIds: undefined,
    mafias: undefined
  }

  socket = undefined

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return true
  }
  
  playerId;
  gameId = this.props.match.params.gameId;

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

    this.signalingSocket = new WebSocket(`ws://localhost:8000/ws/signaling-socket/?access_token=${localStorage.getItem('token')}`);

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
    
    if (playerId != this.playerId) {
      this.peerConnections[playerId].close()
      delete this.peerConnections[playerId];
    }
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
    if (this.socket !== undefined && this.socket.readyState === WebSocket.OPEN) {
      this.socket.onclose = () => {}
      this.socket.close()
    }
    this.videoEndVideoStreaming(this.playerId);
  }

  testGetPeers = () => {
    console.log(this.peerConnections)
  }

  render() {
    if (this.state.playerNames === undefined)
    {
      let defaultNamesArray = []
      for (let i = 0; i < 10; i++)
        defaultNamesArray.push('loading')
      this.state.playerNames = defaultNamesArray
      this.state.playerIds = []
    }
    const loaders = [ClimbingBoxLoader, BarLoader, BeatLoader, BounceLoader,
                     CircleLoader, ClipLoader, DotLoader, FadeLoader, GridLoader,
                     HashLoader, MoonLoader, PacmanLoader, PropagateLoader,
                     PulseLoader, ReactSpinners, RingLoader, RiseLoader,
                     RotateLoader, ScaleLoader, SyncLoader]
    const randomLoader = loaders[Math.floor(Math.abs(Math.random() * 10)) % loaders.length]

    // window.history.pushState(null, null, window.location.href);
    // window.onpopstate = function () {
    //     window.history.go(1);
    // };

    return (
      <div className='container'>
        <Mutation mutation={mutation}
                  variables={{gameId: this.props.match.params.gameId}}
                  update={(cache, { data }) => {
                    this.setState({
                        gameState: "waiting players",
                        token: data.createGamePlayer.gamePlayer.token
                    })
                    if (this.socket === undefined)
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
                      if (data.type === 'update info') {
                        for (let i = 0; i < data.players.length; i++) {
                          this.state.playerNames[i] = data.players[i]
                          this.state.playerIds[i] = data.players_id[i]
                        }
                        for (let i = data.players.length; i < 10; i++)
                          this.state.playerNames[i] = 'loading'

                        this.setState({}) // to update render
                      } else if (data.type === 'sleep') {
                        // power off all cameras
                        this.setState({gameState: 'Whole city is sleeping... Only mafias still work...'})
                      } else if (data.type === 'wakeup mafia') {
                        // POWER ON players with username in data.players
                        this.setState({gameState: 'mafia vote', mafias: data.players})
                      } else if (data.type === 'wakeup inhabitants') {
                        // POWER ON ALL CONNECTION
                        this.setState({gameState: 'inhabitant vote'})
                      } else if (data.type === 'game over') {
                        // power off all
                        this.setState({gameState: 'YOU LOSE!'})
                      } else if (data.type === 'game win') {
                        // power off all
                        this.setState({gameState: 'YOU WIN!'})
                      } else if (data.type === 'remove player') {
                        // power off player with username data.player
                      } else if (data.type === 'message') {
                        this.setState({gameState: data.message})
                      }
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
        <div className='row'style={rowStyle} style={rowStyle}>
          <div className='col s3'>
            {this.playerCardRefs[0].ref && <PlayerCard ref={this.playerCardRefs[0].ref} card_id={0} playerName={this.state.playerNames[0]}/>}
          </div>
          <div className='col s3'>
            {this.playerCardRefs[1].ref && <PlayerCard ref={this.playerCardRefs[1].ref} card_id={1} playerName={this.state.playerNames[1]}/>}
          </div>
          <div className='col s3'>
            {this.playerCardRefs[2].ref && <PlayerCard ref={this.playerCardRefs[2].ref} card_id={2} playerName={this.state.playerNames[2]}/>}
          </div>
          <div className='col s3'>
            {this.playerCardRefs[3].ref && <PlayerCard ref={this.playerCardRefs[3].ref} card_id={3} playerName={this.state.playerNames[3]}/>}
          </div>
        </div>
        <div className='row valign-wrapper' style={rowStyle}>
          <div className='col s3'>
            {this.playerCardRefs[9].ref && <PlayerCard ref={this.playerCardRefs[9].ref} card_id={9} playerName={this.state.playerNames[9]}/>}
          </div>
          <div className='col s6'>
            <div className='card center'>
              <span className="card-title">{
                () => {
                  if (this.state.gameState === 'inhabitant vote')
                    return (
                        <form onSubmit={event => {
                          let select = document.getElementById('select')
                          let selectedUser = select.option[select.selectedIndex].value
                          let data = {type: 'inhabitant vote', player: selectedUser}
                          this.socket.send(JSON.stringify(data))
                          return false;
                        }}>
                          <select id='select'>
                            {() => {
                              let result = ''
                              let players = this.state.playerNames
                              for (let player_index = 0; player_index < players.length; player_index++) {
                                result += `<option value="${players[player_index]}">${players[player_index]}</option>`
                              }
                              return result
                            }}
                          </select>
                          <input type='submit'>vote</input>
                        </form>
                    )
                  else if (this.state.gameState === 'mafia vote')
                    return (
                        <form onSubmit={event => {
                          let select = document.getElementById('select')
                          let selectedUser = select.option[select.selectedIndex].value
                          let data = {type: 'mafia vote', player: selectedUser}
                          this.socket.send(JSON.stringify(data))
                          return false;
                        }}>
                          <select id='select'>
                            {() => {
                              let result = ''
                              let players = this.state.playerNames
                              let mafias = this.state.mafias
                              for (let player_index = 0; player_index < players.length; player_index++) {
                                let is_mafia = false;
                                for (let mafia_index = 0; mafia_index < mafias.length; mafia_index++)
                                  if (players[player_index] === mafias[mafia_index]) {
                                    is_mafia = true
                                    break
                                  }
                                if (!is_mafia)
                                  result += `<option value="${players[player_index]}">${players[player_index]}</option>`
                              }
                              return result
                            }}
                          </select>
                          <input type='submit'>vote</input>
                        </form>
                    )
                  else return this.state.gameState
                }
              }
              </span>
              <div style={{display: 'flex', justifyContent: 'center'}}>
                {React.createElement(randomLoader, {
                  size: 20, sizeUnit: 'px', color:'#1dbc98', loading: this.state.isLoading
                })}
              </div>
              <div className='card-content'>
                <p>Alert</p>
                <p>Info</p>
                <p>Other functionality</p>
                <button className='btn waves-effect waves-light' onClick={this.testGetPeers}>Get peers</button>
              </div>
            </div>
          </div>
          <div className="col s3">
            {this.playerCardRefs[4].ref && <PlayerCard ref={this.playerCardRefs[4].ref} card_id={4} playerName={this.state.playerNames[4]}/>}
          </div>
        </div>
        <div className="row">
          <div className="col s3">
            {this.playerCardRefs[8].ref && <PlayerCard ref={this.playerCardRefs[8].ref} card_id={8} playerName={this.state.playerNames[8]}/>}
          </div>
          <div className="col s3">
            {this.playerCardRefs[7].ref && <PlayerCard ref={this.playerCardRefs[7].ref} card_id={7} playerName={this.state.playerNames[7]}/>}
          </div>
          <div className="col s3">
            {this.playerCardRefs[6].ref && <PlayerCard ref={this.playerCardRefs[6].ref} card_id={6} playerName={this.state.playerNames[6]}/>}
          </div>
          <div className="col s3">
            {this.playerCardRefs[5].ref && <PlayerCard ref={this.playerCardRefs[5].ref} card_id={5} playerName={this.state.playerNames[5]}/>}
          </div>
        </div>
      </div>
    )
  }
}