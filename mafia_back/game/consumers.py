import json

from channels.generic.websocket import WebsocketConsumer
from .models import GamePlayer
from typing import Dict, List
from collections import defaultdict

rooms: Dict[int, List['GameAwaitConsumer']] = {}


class GameAwaitConsumer(WebsocketConsumer):
    token = None
    game_id = None

    def connect(self):
        print("connected")
        self.accept()

    def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        print(data)

        if self.token is None:
            self.token = data['token']
        if self.game_id is None:
            self.game_id = GamePlayer.objects.get(token=data['token']).game_id
        if self.game_id not in rooms:
            rooms[self.game_id] = []
        if self not in rooms[self.game_id]:
            rooms[self.game_id].append(self)

        if data['type'] == 'update info':
            for consumer in rooms[self.game_id]:
                consumer.update_info()

    def update_info(self):
        message = {}
        message['type'] = 'update info'
        message['players'] = []

        for game_player in GamePlayer.objects.filter(game_id=self.game_id):
            message['players'].append(game_player.player.username)

        self.send(json.dumps(message))

    def disconnect(self, message):
        print("disconnect")
        GamePlayer.objects.get(token=self.token).delete()
        rooms[self.game_id].remove(self)
        for user in rooms[self.game_id]:
            user.update_info()

from game.models import GamePlayer

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
        user = self.scope['user']
        text_data_json = json.loads(text_data)
        game_id = int(text_data_json['game_id'])
        player_id = int(text_data_json['player_id'])

        # check that user have access
        if (user.is_anonymous
                or not GamePlayer.objects.filter(
                            player_id=user.id, game_id=game_id
                        ).exists()
                or player_id != user.id):
            return

        if text_data_json['type'] in self.only_transfer_types:
            target_id = int(text_data_json['target_id'])
            self.game_players[game_id][target_id].send(
                json.dumps(text_data_json)
            )
        elif text_data_json['type'] == 'player-joined':

            if player_id in self.game_players[game_id].keys():
                return

            for player_consumer in self.game_players[game_id].values():
                player_consumer.send(text_data)

            self.game_players[game_id][player_id] = self
