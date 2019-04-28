from channels.routing import ProtocolTypeRouter, URLRouter
import game.routing
from game.token_auth import TokenAuthMiddleware

application = ProtocolTypeRouter({
    'websocket': TokenAuthMiddleware(
        URLRouter(
            game.routing.websocket_urlpatterns
        )
    ),
})
