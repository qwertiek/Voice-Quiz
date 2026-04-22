require: slotfilling/slotFilling.sc
  module = sys.zb-common

require: js/getters.js
require: js/reply.js
require: js/actions.js

require: sc/selectOption.sc
require: sc/gameControl.sc
require: sc/assistantReply.sc

theme: /
    state: Start
        q!: $regex</start>
        q!: голосовой квиз
        q!: (запусти|открой|включи) голосовой квиз
        a: Начинаем Голосовой Квиз.

    state: Fallback
        event!: noMatch
        script:
            log('entryPoint: Fallback: context: ' + JSON.stringify($context))
        a: Я понимаю команды квиза: А, Б, В, Г, повтори вопрос, мой счёт, новая игра.
