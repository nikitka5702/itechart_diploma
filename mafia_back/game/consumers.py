import json

from channels.generic.websocket import WebsocketConsumer
from .models import GamePlayer
from typing import Dict, List, Union
from collections import defaultdict
from .game_logic import GameLogic

rooms: Dict[int, List['GameAwaitConsumer']] = {}


class GameAwaitConsumer(WebsocketConsumer):
    token = None
    game_id = None
    username = None
    game_logic: GameLogic = None

    '''
    format of sending to server data:
    
    {"type": "mafia vote", "player", "player name that have been selected by one mafia"}
    {"type": "inhabitant vote", "player name that have been selected by one inhabitant in court"}
    {"type": "update info", "token": "token that have been sent through mutation"}
    
    see responses in GameLogic class
    '''

    def connect(self):
        self.accept()

    def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        print(data)

        game_player = \
            GamePlayer.objects.get(token=data['token']) if data['type'] == 'update info' else None

        if self.token is None:
            self.token = data['token']
        if self.game_id is None:
            self.game_id = game_player.game_id
        if self.game_id not in rooms:
            rooms[self.game_id] = []
        if self.username is None:
            self.username = game_player.player.username
        if self not in rooms[self.game_id]:
            rooms[self.game_id].append(self)

        if data['type'] == 'update info':
            for consumer in rooms[self.game_id]:
                consumer.update_info()
        elif data['type'] == 'mafia vote':
            self.game_logic.set_mafia_response(data['player'])
        elif data['type'] == 'inhabitant vote':
            self.game_logic.set_inhabitant_response(data['player'])

        if game_player.game.players == len(rooms[game_player.game_id]) and data['type'] == 'update info':
            game_logic = GameLogic(rooms[game_player.game_id], game_player.game.people_as_mafia)  # init game logic
            for player in rooms[game_player.game_ids]:
                player.game_logic = game_logic

    def update_info(self):
        message: Dict[str, Union[str, List[str]]] = {}
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
