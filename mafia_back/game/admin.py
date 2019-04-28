from django.contrib import admin
from .models import Statistic, CardSet, Game, GamePlayer

# Register your models here.
admin.site.register(Statistic)
admin.site.register(CardSet)
admin.site.register(Game)
admin.site.register(GamePlayer)
