theme: /

    state: CanvasReply
        event!: voice_quiz_feedback
        event!: VOICE_QUIZ_FEEDBACK
        script:
            var eventData = $context && $context.request && $context.request.data && $context.request.data.eventData || {};
            var params = eventData.parameters || {};
            var value = params.value || "";
            $reactions.answer({
                "value": value
            });
