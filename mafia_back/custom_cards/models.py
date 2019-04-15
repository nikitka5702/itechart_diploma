from django.db import models
from mafia_back.settings import CARD_PIXEL_HEIGHT, CARD_PIXEL_WIDTH


class SimpleCardSet(models.Model):

    pieceHabitat = models.ImageField(
        width_field=CARD_PIXEL_WIDTH,
        height_field=CARD_PIXEL_HEIGHT,
        upload_to=f'uploads/cards/%Y/%m/%d/'
    )
    mafia = models.ImageField(
        width_field=CARD_PIXEL_WIDTH,
        height_field=CARD_PIXEL_HEIGHT,
        upload_to=f'uploads/cards/%Y/%m/%d/'
    )


class ExtendedCardSet(SimpleCardSet):
    serif = models.ImageField(
        width_field=CARD_PIXEL_WIDTH,
        height_field=CARD_PIXEL_HEIGHT,
        upload_to=f'uploads/cards/%Y/%m/%d/'
    )  # policeman. He checks players at night. If he found mafia he will be know that
    loveMaker = models.ImageField(
        width_field=CARD_PIXEL_WIDTH,
        height_field=CARD_PIXEL_HEIGHT,
        upload_to=f'uploads/cards/%Y/%m/%d/'
    )  # love maker. He/she can give alibi. In some rules he/she can do not give to make step
    doctor = models.ImageField(
        width_field=CARD_PIXEL_WIDTH,
        height_field=CARD_PIXEL_HEIGHT,
        upload_to=f'uploads/cards/%Y/%m/%d/'
    )  # doctor. He hills one player at night. If any player was killed and had been selected by doctor, he survive
