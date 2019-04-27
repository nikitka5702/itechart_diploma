import re

import graphene
import uuid
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db.models import Q
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError

from .models import Statistic, Game, GamePlayers, CardSet, ActivationSource


class CardType(DjangoObjectType):
    class Meta:
        model = CardSet


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
        model = GamePlayers


class CreateUser(graphene.Mutation):
    user = graphene.Field(UserType)
    EMAIL_PATTERN = r"^[a-zA-Z0-9_]+@[a-zA-Z0-9_]+\.[A-Za-z]{2}$"

    class Arguments:
        username = graphene.String()
        password = graphene.String()
        email = graphene.String()

    @staticmethod
    def get_submit_url(user_id):
        activation_source = None
        try:
            activation_source = ActivationSource.objects.get(user_id=user_id)
        except ActivationSource.DoesNotExist:
            activation_source = ActivationSource(user_id=user_id, key=str(uuid.uuid4()))
            activation_source.save()
        finally:
            return f"{settings.SITE_URL}/activation/?token={activation_source.key}"

    @staticmethod
    def get_html_email_content(user_id):
        return f"""
        Hello! This mail is used to registration to the Mafia The Game (c) <br>
        go to <a href="{CreateUser.get_submit_url(user_id)}">here</a> to submit form
        
        (row link: <b>{CreateUser.get_submit_url(user_id)}</b> )
        """

    @staticmethod
    def get_raw_email_content(user_id):
        return f"""
        Hello! This mail is used to registration to the Mafia The Game (c)
        Use link to approve your registration:
        {CreateUser.get_submit_url(user_id)}
        """

    def mutate(self, info, username, password, email):

        # check is email valid just in case
        if re.match(CreateUser.EMAIL_PATTERN, email) is None:
            raise GraphQLError("email is invalid")

        user = User(
            username=username,
            email=email,
            is_active=False
        )
        user.set_password(password)
        user.save()

        send_mail("registration", CreateUser.get_raw_email_content(user.id),
                  settings.EMAIL_HOST_USER, (email,),
                  html_message=CreateUser.get_html_email_content(user.id))

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


class CreateCardSet(graphene.Mutation):

    result = graphene.Field(CardType)

    class Arguments:
        is_extended = graphene.Boolean()
        citizen = Upload()
        mafia = Upload()

        # extended
        sheriff = Upload(required=False)
        doctor = Upload(required=False)

    def mutate(self, info, is_extended, citizen, mafia, doctor=None, sheriff=None):
        if info.context.user.is_anonymous:
            raise GraphQLError("you must be logged in!")

        if is_extended:
            card_set = CardSet(extended=True, citizen=citizen, mafia=mafia, doctor=doctor, sheriff=sheriff)
        else:
            card_set = CardSet(extended=False, citizen=citizen, mafia=mafia)
        card_set.save()

        return CreateCardSet(result=card_set)


class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    statistic = graphene.Field(StatisticType)
    games = graphene.List(
        GameType,
        search=graphene.String(),
        first=graphene.Int(),
        skip=graphene.Int()
    )
    card_set = graphene.Field(
        CardType,
        get_list=graphene.Boolean()
    )
    card_set_list = graphene.List(CardType)

    def resolve_card_set(self, info, selection, **kwargs):
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            raise GraphQLError('You must be logged in!')
        return CardSet.objects.get(id=selection)

    def resolve_card_set_list(self, info, **kwargs):
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            raise GraphQLError('You must be logged in!')
        return CardSet.objects.all()

    def resolve_me(self, info, **kwargs):
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            raise GraphQLError('Not logged in!')
        return user

    def resolve_statistic(self, info, **kwargs):
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            raise GraphQLError('Not logged in!')
        return user.statistics.first()

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
