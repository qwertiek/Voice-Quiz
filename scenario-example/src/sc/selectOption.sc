theme: /

    state: SelectOptionA
        q!: а
        q!: вариант а
        q!: ответ а

        script:
            log('selectOptionA: context: ' + JSON.stringify($context))
            selectOption("A", $context);
            addSuggestions(["Повтори вопрос", "Мой счёт"], $context);

    state: SelectOptionB
        q!: б
        q!: вариант б
        q!: ответ б

        script:
            log('selectOptionB: context: ' + JSON.stringify($context))
            selectOption("B", $context);
            addSuggestions(["Повтори вопрос", "Мой счёт"], $context);

    state: SelectOptionV
        q!: в
        q!: вариант в
        q!: ответ в

        script:
            log('selectOptionV: context: ' + JSON.stringify($context))
            selectOption("V", $context);
            addSuggestions(["Повтори вопрос", "Мой счёт"], $context);

    state: SelectOptionG
        q!: г
        q!: вариант г
        q!: ответ г

        script:
            log('selectOptionG: context: ' + JSON.stringify($context))
            selectOption("G", $context);
            addSuggestions(["Повтори вопрос", "Мой счёт"], $context);
