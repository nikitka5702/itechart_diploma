import json

from channels.generic.websocket import WebsocketConsumer
from .models import GamePlayer
from typing import Dict, List

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

