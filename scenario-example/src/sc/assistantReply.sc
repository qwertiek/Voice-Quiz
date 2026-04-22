theme: /

    state: ОзвучкаИзCanvas
        event!: voice_quiz_feedback
        script:
            var eventData = $context && $context.request && $context.request.data && $context.request.data.eventData || {};
            var params = eventData.parameters || {};
            var value = params.value || "";
            $reactions.answer({
                "value": value,
            });
