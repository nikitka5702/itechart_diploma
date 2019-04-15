import graphene
from django.contrib.auth.models import User
from django.db.models import Q, Avg
from graphene_django import DjangoObjectType
from graphql import GraphQLError

from .models import Statistic, Game, GamePlayers


class UserType(DjangoObjectType):
    class Meta:
        model = User
        only_fields = ('id', 'username')


class StatisticType(DjangoObjectType):
    class Meta:
        model = Statistic


class GameType(DjangoObjectType):
    class Meta:
        model = Game


class GamePlayersType(DjangoObjectType):
    class Meta:
        models = GamePlayers


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
        name = graphene.String()
        players = graphene.Int()
        percentage = graphene.Int()

    def mutate(self, info, name, players, percentage):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError('You must be logged in!')
        game = Game.objects.create(
            creator=user,
            name=name,
            players=players,
            mafia_percentage=percentage
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

    def resolve_games(self, info, search=None, first=None, skip=None, **kwargs):
        qs = Game.objects.all()
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
