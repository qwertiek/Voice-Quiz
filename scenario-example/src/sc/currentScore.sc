theme: /

    state: CurrentScore
        q!: мой счет
        q!: мой счёт

        script:
            log('currentScore: context: ' + JSON.stringify($context))
            requestCurrentScore($context);
            addSuggestions(["Повтори вопрос", "Новая игра"], $context);
