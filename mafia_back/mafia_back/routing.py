from channels.routing import ProtocolTypeRouter, URLRouter
import game.consumers as consumers
from django.conf.urls import url

application = ProtocolTypeRouter({
    "websocket": URLRouter([
        url(r'^gameAwait/$', consumers.GameAwaitConsumer),
        url('ws/game/', consumers.SignalingServerConsumer),
    ])
})
