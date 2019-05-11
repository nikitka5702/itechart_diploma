import graphene
import uuid
from django.contrib.auth.models import User
from django.db.models import Q, Avg
from graphene_django import DjangoObjectType
from graphql import GraphQLError

from .models import Statistic, CardSet, Game, GamePlayer


class UserType(DjangoObjectType):
    class Meta:
        model = User
        only_fields = ('id', 'username')


class StatisticType(DjangoObjectType):
    class Meta:
        model = Statistic


class CardSetType(DjangoObjectType):
    class Meta:
        model = CardSet


class GameType(DjangoObjectType):
    class Meta:
        model = Game


class GamePlayersType(DjangoObjectType):
    class Meta:
        model = GamePlayer


class CreateGamePlayer(graphene.Mutation):
    game_player = graphene.Field(GamePlayersType)

    class Arguments:
        gameId = graphene.NonNull(graphene.Int)

    def mutate(self, info, gameId):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError("you must be logged in!")
        try:
            game_player = GamePlayer.objects.get(player_id=user.id, game_id=gameId, is_used=False)
        except GamePlayer.DoesNotExist:
            game_player = GamePlayer(player_id=user.id, game_id=gameId, token=uuid.uuid4())
            game_player.save()
        return CreateGamePlayer(game_player=game_player)


class CreateUser(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String()
        password = graphene.String()
        email = graphene.String()

    def mutate(self, info, username, password, email):
        user = User(
            username=username,
            email=email
        )

        user.set_password(password)
        user.save()

        Statistic.objects.create(user=user)

        return CreateUser(user=user)


class CreateGame(graphene.Mutation):
    game = graphene.Field(GameType)

    class Arguments:
        name = graphene.NonNull(graphene.String)
        extended = graphene.NonNull(graphene.Boolean)
        card_set = graphene.NonNull(graphene.Int)
        players = graphene.NonNull(graphene.Int)
        as_mafia = graphene.NonNull(graphene.Int)
        as_doctor = graphene.Int()
        as_sheriff = graphene.Int()

    def mutate(self, info, name, extended, card_set, players, as_mafia, as_doctor, as_sheriff):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError('You must be logged in!')
        game = Game.objects.create(
            creator=user,
            name=name,
            extended=extended,
            card_set_id=card_set,
            players=players,
            people_as_mafia=as_mafia,
            people_as_doctor=as_doctor,
            people_as_sheriff=as_sheriff
        )

        return CreateGame(game=game)


class DeleteGame(graphene.Mutation):
    result = graphene.String()

    class Arguments:
        id = graphene.Int()

    def mutate(self, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError('You must be logged in!')
        item = Game.objects.get(id=id)
        if item.creator != user:
            raise GraphQLError('Wrong user!')
        else:
            item.delete()
            return DeleteGame(result="Done")


class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    statistic = graphene.Field(StatisticType)
    games = graphene.List(
        GameType,
        search=graphene.String(),
        first=graphene.Int(),
        skip=graphene.Int()
    )

    def resolve_me(self, info, **kwargs):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError('Not logged in!')
        return user

    def resolve_statistic(self, info, **kwargs):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError('Not logged in!')
        return user.statistics.first()

    def resolve_games(self, info, search=None, first=None, skip=None, **kwargs):
        print(info.context.user.is_anonymous)
        if info.context.user.is_anonymous:
            raise GraphQLError("you must be logged to see and join to games")
        qs = Game.objects.filter(Q(finished=False))
        if search:
            qs = qs.filter(Q(name__icontains=search))
        if skip:
            qs = qs[skip:]
        if first:
            qs = qs[:first]
        return qs




class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_game = CreateGame.Field()
    delete_game = DeleteGame.Field()
    create_game_player = CreateGamePlayer.Field()

