require: slotfilling/slotFilling.sc
  module = sys.zb-common
  
# Подключение javascript обработчиков
require: js/getters.js
require: js/reply.js
require: js/actions.js

# Подключение сценарных файлов
require: sc/selectOption.sc
require: sc/repeatQuestion.sc
require: sc/currentScore.sc
require: sc/restartGame.sc
require: sc/voiceFeedback.sc


patterns:
    $AnyText = $nonEmptyGarbage

theme: /
    state: Start
        # При запуске приложения с кнопки прилетит сообщение /start.
        q!: $regex</start>
        # При запуске голосом должна отрабатываться команда открытия смартапа.
        q!: (запусти | открой | включи) голосовой квиз
        q!: голосовой квиз
        a: Начнём.

    state: Fallback
        event!: noMatch
        script:
            log('entryPoint: Fallback: context: ' + JSON.stringify($context))
            addSuggestions(["А", "Повтори вопрос", "Мой счёт", "Новая игра"], $context);
        a: Я понимаю команды квиза: А, Б, В, Г, повтори вопрос, мой счёт, новая игра.
