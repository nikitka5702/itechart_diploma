from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import game.consumers as consumers
import game.routing
from django.conf.urls import url

from game.token_auth import TokenAuthMiddleware

application = ProtocolTypeRouter({
    "websocket": TokenAuthMiddleware(
        URLRouter([
            url(r'^gameAwait/$', consumers.GameAwaitConsumer),
            url('ws/signaling-socket/', consumers.SignalingServerConsumer),
        ])
    ),
})
