from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator


User = get_user_model()


class Statistic(models.Model):
    class Meta:
        verbose_name = 'Статистика'
        verbose_name_plural = 'Статистики'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='statistics', verbose_name='Пользователь')
    games_count = models.IntegerField(default=0, verbose_name='Кол-во игр')
    games_won = models.IntegerField(default=0, verbose_name='Кол-во побед')
    games_lost = models.IntegerField(default=0, verbose_name='Кол-во поражений')
    as_mafia = models.IntegerField(default=0, verbose_name='Кол-во игр за мафию')
    as_citizen = models.IntegerField(default=0, verbose_name='Кол-во игр за мирных')


class Game(models.Model):
    class Meta:
        verbose_name = 'Игра'
        verbose_name_plural = 'Игры'

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_games')
    name = models.CharField(max_length=255)
    players = models.IntegerField()
    mafia_percentage = models.IntegerField(
        default=20,
        validators=[
            MinValueValidator(20),
            MaxValueValidator(100)
        ]
    )
    finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)


class GamePlayers(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='connected_players')
    player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games')
