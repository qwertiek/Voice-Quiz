theme: /

    state: RepeatQuestion
        q!: повтори вопрос
        script:
            repeatQuestion($context);
        a: Повторяю вопрос.

    state: CurrentScore
        q!: мой счет
        q!: мой счёт
        script:
            requestCurrentScore($context);
        a: Озвучиваю текущий счёт.

    state: RestartGame
        q!: начать заново
        q!: новая игра
        q!: сыграть еще
        q!: сыграть ещё
        script:
            restartGame($context);
        a: Начинаем новую игру.
