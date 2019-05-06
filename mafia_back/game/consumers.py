import json

from channels.generic.websocket import WebsocketConsumer


class GameAwaitConsumer(WebsocketConsumer):

    def connect(self):
        print("connected")
        self.accept()

    def receive(self, text_data=None, bytes_data=None):
        print(text_data)
        message = {}
        if text_data == 'update info':
            message['type'] = 'update info'
            message['info'] = f'players to play: {1}/{1}'
        self.send(json.dumps(message))

    def disconnect(self, message):
        pass
