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


class CardSet(models.Model):
    extended = models.BooleanField(default=False)

    # Classic
    citizen = models.ImageField(upload_to='cards/%Y/%m/%d')
    mafia = models.ImageField(upload_to='cards/%Y/%m/%d')

    # Extended
    sheriff = models.ImageField(upload_to='cards/%Y/%m/%d')
    doctor = models.ImageField(upload_to='cards/%Y/%m/%d')


class Game(models.Model):
    class Meta:
        verbose_name = 'Игра'
        verbose_name_plural = 'Игры'

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_games')
    name = models.CharField(max_length=255)
    extended = models.BooleanField(default=False)
    card_set = models.OneToOneField(CardSet, on_delete=models.CASCADE, null=True)

    # Classic
    players = models.IntegerField(
        default=5,
        validators=[
            MinValueValidator(5),
            MaxValueValidator(10)
        ]
    )
    people_as_mafia = models.IntegerField(
        default=2,
        validators=[
            MinValueValidator(2),
            MaxValueValidator(4)
        ]
    )

    # Extended
    people_as_doctor = models.IntegerField(
        default=1,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(2)
        ]
    )
    people_as_sheriff = models.IntegerField(
        default=1,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(2)
        ]
    )

    finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)


class GamePlayers(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='connected_players')
    player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games')
