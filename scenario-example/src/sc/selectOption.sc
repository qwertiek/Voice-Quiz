theme: /

    state: ВыборОтветаА
        q!: [выбери] [вариант|ответ] а
        q!: а
        script:
            selectOption("A", $context);
        a: Приняла вариант А.

    state: ВыборОтветаБ
        q!: [выбери] [вариант|ответ] б
        q!: б
        script:
            selectOption("B", $context);
        a: Приняла вариант Б.

    state: ВыборОтветаВ
        q!: [выбери] [вариант|ответ] в
        q!: в
        script:
            selectOption("V", $context);
        a: Приняла вариант В.

    state: ВыборОтветаГ
        q!: [выбери] [вариант|ответ] г
        q!: г
        script:
            selectOption("G", $context);
        a: Приняла вариант Г.
