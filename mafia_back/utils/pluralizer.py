def pluralize(value, arg):
    """
    Подставляет слово в нужном склонении в зависимости от числа

    pluralize(14, 'монету,монеты,монет') -> монет


    :param value: int
    :param arg: str
    :return: str
    """
    args = arg.split(',')
    try:
        number = abs(int(value))
    except TypeError:
        number = 0

    a = number % 10
    b = number % 100

    if (a == 1) and (b != 11):
        return args[0]
    elif (a >= 2) and (a <= 4) and ((b < 10) or (b >= 20)):
        return args[1]
    else:
        return args[2]
