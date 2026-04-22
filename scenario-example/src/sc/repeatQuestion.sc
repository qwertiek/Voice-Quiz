theme: /

    state: RepeatQuestion
        q!: повтори вопрос

        script:
            log('repeatQuestion: context: ' + JSON.stringify($context))
            repeatQuestion($context);
            addSuggestions(["Мой счёт", "Новая игра"], $context);

        a: Повторяю вопрос.
