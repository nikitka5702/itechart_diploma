from threading import Thread
from typing import List, NoReturn, Dict, Any
import random
import time


class GameLogic(Thread):

    STATE_SLEEP = '{"type": "sleep"}'
    STATE_WAKE_UP_MAFIA = '{"type": "wakeup mafia"}'
    STATE_WAKE_UP_INHABITANTS = '{"type": "wakeup inhabitants"}'
    STATE_GAME_OVER = '{"type": "game over"}'
    STATE_GAME_WIN = '{"type": "game win"}'
    STATE_SEND_MAFIA_RULES = '{"type": "rules", "rule": "mafia"}'
    STATE_SEND_INHABITANT_RULES = '{"type": "rules", "rule": "inhabitant"}'
    STATE_REMOVE_PLAYER = '{"type": "remove player", "player":"%s"}'  # in place of %s will be player name

    '''
    message format is:
    {"type": "message", "message": "message text"}
    '''
    MESSAGE_BECOME_ACQUAINTED = "time to become acquainted"
    MESSAGE_KILLED_BY_MAFIA = 'today killed player is '
    MESSAGE_KILLED_IN_COURT = 'today convicted player is '

    _mafia_sent_response = False
    _mafias_responded = 0
    _mafia_response = None
    _mafia_responses = []

    _inhabitant_sent_response = False
    _inhabitants_responded = 0
    _inhabitant_response = None
    _inhabitant_responses = []

    _game_over = False

    def __init__(self, players_list: List, mafia_number):
        super().__init__()
        self.players_and_rules: Dict[Any, str] = {}

        for player in players_list:
            self.players_and_rules[player] = 'inhabitant'

        mafia_to_spread = mafia_number
        while mafia_to_spread > 0:
            index = random.randint(0, len(players_list) - 1)
            if self.players_and_rules[list(self.players_and_rules.keys())[index]] == 'mafia':
                continue

            self.players_and_rules[list(self.players_and_rules.keys())[index]] = 'mafia'
            index -= 1

        self.start()

    def set_mafia_response(self, response_of_mafia: str):
        self._mafias_responded += 1

        self._mafia_responses.append(response_of_mafia)

        if self._mafias_responded == list(self.players_and_rules.values()).count('mafia'):
            self._mafias_responded = 0
            self._mafia_sent_response = True
            self._mafia_response = response_of_mafia
            # choose major response or random if equal
            responses = set(self._mafia_responses)
            responses_votes = {response: self._mafia_responses.count(response) for response in responses}
            max_vote = 0
            for vote in responses_votes.values():
                if max_vote < vote:
                    max_vote = vote

            indexes_of_max_votes: List[int] = []
            for index in range(len(responses_votes.values())):
                votes = list(responses_votes.values())
                if votes[index] == max_vote:
                    indexes_of_max_votes.append(votes[index])

            self._mafia_response = \
                list(responses)[indexes_of_max_votes[random.randint(0, len(indexes_of_max_votes) - 1)]]

    def set_inhabitant_response(self, response_of_inhabitant: str):
        self._inhabitants_responded += 1

        self._inhabitant_responses.append(response_of_inhabitant)

        if self._inhabitants_responded == list(self.players_and_rules.values()):
            self._inhabitants_responded = 0
            self._inhabitant_sent_response = True
            self._inhabitant_response = response_of_inhabitant
            # choose major response or random if equal
            responses = set(self._inhabitant_responses)
            responses_votes = {response: self._inhabitant_responses.count(response) for response in responses}
            max_vote = 0
            for vote in responses_votes.values():
                if max_vote < vote:
                    max_vote = vote

            indexes_of_max_votes: List[int] = []
            for index in range(len(responses_votes.values())):
                votes = list(responses_votes.values())
                if votes[index] == max_vote:
                    indexes_of_max_votes.append(votes[index])

            self._inhabitant_response = \
                list(responses)[indexes_of_max_votes[random.randint(0, len(indexes_of_max_votes) - 1)]]

    def run(self) -> NoReturn:
        self.send_rules()
        time.sleep(5)  # sleep for see rule
        self.send_message(GameLogic.MESSAGE_BECOME_ACQUAINTED)
        time.sleep(20)  # sleep for become acquainted
        while not self._game_over:
            self.send_state(GameLogic.STATE_SLEEP)
            self.send_state(GameLogic.STATE_WAKE_UP_MAFIA)

            while not self._mafia_sent_response:
                time.sleep(5)
            self._mafia_sent_response = False

            self.send_state(GameLogic.STATE_WAKE_UP_INHABITANTS)
            for player in self.players_and_rules.keys():
                if player.username == self._mafia_response:
                    player.send(GameLogic.STATE_GAME_OVER)
                    self.players_and_rules.pop(player)
                else:
                    player.send_message(GameLogic.MESSAGE_KILLED_BY_MAFIA + self._mafia_response)
                    self.send_state(GameLogic.STATE_REMOVE_PLAYER % self._mafia_response)
            time.sleep(5)

            while not self._inhabitant_sent_response:
                time.sleep(5)
            self._inhabitant_sent_response = False

            for player in self.players_and_rules.keys():
                if player.username == self._mafia_response:
                    player.send(GameLogic.STATE_GAME_OVER)
                    self.players_and_rules.pop(player)
                else:
                    player.send_message(GameLogic.MESSAGE_KILLED_IN_COURT + self._inhabitant_response)
                    self.send_state(GameLogic.STATE_REMOVE_PLAYER % self._inhabitant_response)

            time.sleep(5)
            if list(self.players_and_rules.values()).count('mafia') >= \
                    list(self.players_and_rules.values()).count('inhabitant') + 1:
                for player in self.players_and_rules.keys():
                    if self.players_and_rules[player] == 'mafia':
                        self.send_state(GameLogic.STATE_GAME_WIN)
                    else:
                        self.send_state(GameLogic.STATE_GAME_OVER)
                    self._game_over = True

    def send_state(self, state: str):
        for player in self.players_and_rules.keys():
            player.send(state)

    def send_rules(self) -> NoReturn:
        for player in self.players_and_rules.keys():
            if self.players_and_rules[player] == 'mafia':
                player.send(GameLogic.STATE_SEND_MAFIA_RULES)
            else:
                player.send(GameLogic.STATE_SEND_INHABITANT_RULES)

    def send_message(self, message: str):
        for player in self.players_and_rules.keys():
            player.send(f'{{"type": "message", "message": {message}}}')
