theme: /

    state: OptionA
        q!: а
        q!: вариант а
        q!: ответ а
        script:
            selectOption("A", $context);
        a: Приняла вариант А.

    state: OptionB
        q!: б
        q!: вариант б
        q!: ответ б
        script:
            selectOption("B", $context);
        a: Приняла вариант Б.

    state: OptionV
        q!: в
        q!: вариант в
        q!: ответ в
        script:
            selectOption("V", $context);
        a: Приняла вариант В.

    state: OptionG
        q!: г
        q!: вариант г
        q!: ответ г
        script:
            selectOption("G", $context);
        a: Приняла вариант Г.
