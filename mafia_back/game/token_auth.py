from urllib.parse import parse_qs

from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from graphql_jwt.utils import get_payload

from game.models import User


class TokenAuthMiddleware:

    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        # impl
        try:
            token = parse_qs(scope['query_string'])[b'access_token'][0]
            payload = get_payload(token)
            scope['user'] = User.objects.get(username=payload['username'])
        except Exception:
            scope['user'] = AnonymousUser()
        return self.inner(scope)

TokenAuthMiddlewareStack = lambda inner: TokenAuthMiddleware(AuthMiddlewareStack(inner))
