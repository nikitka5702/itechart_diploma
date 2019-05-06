from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf.urls import url
from game import consumers

application = ProtocolTypeRouter({
    "websocket": URLRouter([
        url(r'^gameAwait/$', consumers.GameAwaitConsumer),
    ])
})
