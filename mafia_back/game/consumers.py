import json

from channels.generic.websocket import WebsocketConsumer
from .models import GamePlayer


class GameAwaitConsumer(WebsocketConsumer):

    def connect(self):
        print("connected")
        self.accept()

    def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        print(data)

        if data['type'] == 'update info':
            self.update_info(GamePlayer.objects.get(token=data['token']).game_id)

    def update_info(self, game_id):
        message = {}
        message['type'] = 'update info'
        message['players'] = []

        for game_player in GamePlayer.objects.filter(game_id=game_id):
            message['players'].append(game_player.player.username)

        self.send(json.dumps(message))

    def disconnect(self, message):
        pass
