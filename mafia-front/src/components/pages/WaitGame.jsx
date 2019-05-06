import React, { Component } from 'react'
import { ClimbingBoxLoader, BarLoader, BeatLoader, BounceLoader,
CircleLoader, ClipLoader, DotLoader, FadeLoader, GridLoader,
HashLoader, MoonLoader, PacmanLoader, PropagateLoader,
PulseLoader, ReactSpinners, RingLoader, RiseLoader,
RotateLoader, ScaleLoader, SyncLoader } from 'react-spinners'
import { css } from '@emotion/core'


const override = css`
  margin: 0 auto;
  height: 100%;
`

export default class WaitPage extends Component {
  render() {
    const loaders = [ClimbingBoxLoader, BarLoader, BeatLoader, BounceLoader,
                     CircleLoader, ClipLoader, DotLoader, FadeLoader, GridLoader,
                     HashLoader, MoonLoader, PacmanLoader, PropagateLoader,
                     PulseLoader, ReactSpinners, RingLoader, RiseLoader,
                     RotateLoader, ScaleLoader, SyncLoader]

    const randomLoader = loaders[Math.floor(Math.abs(Math.random() * 100)) % loaders.length]
    const socket = new WebSocket("ws://localhost:8000/gameAwait/");
    socket.onmessage = ev => {
      let message = JSON.parse(ev.data)
      if (ev.data['type'] === 'complete') {
        //todo redirect to game
      } else if (ev.data['type'] === 'gameDeleted') {
        //todo redirect to games
      } else if (ev.data['type'] === 'update info') {
          document.getElementById('wait info').innerHTML = ev.data['info']
      }
    }
    socket.onopen = ev => {
        socket.send("update info")
    }

    return (
      <div className='sweet-loading' style={{display: 'flex', justifyContent: 'center',
          alignItems: 'center', flexWrap: 'wrap', flexDirection: 'column', height: '100%'}}>
          {React.createElement(randomLoader, { css: override, size: 20, sizeUnit: 'px',
                                                     color:'#1dbc98', loading:true })}
          <div id={"wait info"}>
              players to play: 0/0
          </div>
      </div>
    )
  }
}