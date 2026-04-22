theme: /

    state: RestartGame
        q!: начать заново
        q!: новая игра
        q!: сыграть еще
        q!: сыграть ещё

        script:
            log('restartGame: context: ' + JSON.stringify($context))
            restartGame($context);
            addSuggestions(["Повтори вопрос", "Мой счёт"], $context);

        a: Начинаем новую игру.
