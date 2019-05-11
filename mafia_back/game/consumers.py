from collections import defaultdict
from typing import Dict

from channels.generic.websocket import WebsocketConsumer
import json


'''
text_data structure:
  
  # Add user to signaling server dict, send this message to all players in game
    
    text_data {
        type: 'player-joined'
        game_id: int
        player_id: int
    }
    
    text_data {
        type: 'player-disconnected'
        game_id: int
        player_id: int
    }

  #Exchanging session descriptions

    text_data {
        type: 'video-offer'
        game_id: int
        player_id: int
        target_id: int
        sdp: str
    }
    
    text_data {
        type: 'video-answer'
        game_id: int
        player_id: int
        target_id: int
        sdp: str
    }
    
  #Exchanging ICE candidates

    text_data {
        type: 'new-ice-candidate'
        game_id: int
        player_id: int
        target_id: int
        candidate: str
    }

'''


class SignalingServerConsumer(WebsocketConsumer):

    game_players: Dict[int, dict] = defaultdict(dict)

    only_transfer_types = ('video-offer', 'video-answer', 'new-ice-candidate')

    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        for game_id, players in self.game_players.items():
            for player_id, player in players.items():
                if player == self:
                    del players[player_id]

                    for player_in_game in self.game_players[game_id].values():
                        player_in_game.send(json.dumps({
                            'type': 'player-disconnected',
                            'game_id': game_id,
                            'player_id': player_id
                        }))
                    return

    def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        game_id = int(text_data_json['game_id'])

        if text_data_json['type'] in self.only_transfer_types:
            target_id = int(text_data_json['target_id'])
            self.game_players[game_id][target_id].send(
                json.dumps(text_data_json)
            )
        elif text_data_json['type'] == 'player-joined':
            player_id = int(text_data_json['player_id'])

            if player_id in self.game_players[game_id].keys():
                return

            for player in self.game_players[game_id].values():
                player.send(text_data)

            self.game_players[game_id][player_id] = self
