theme: /
    
    state: VoiceFeedback
        event!: done
        event!: DONE
        
        script:
            log('voiceFeedback: context: ' + JSON.stringify($context))
            var eventData = $context && $context.request && $context.request.data && $context.request.data.eventData || {}
            log('voiceFeedback: eventData: ' + JSON.stringify(eventData))
            var params = eventData.parameters || {}
            $reactions.answer({
                "value": params.value || "",
            });
            addSuggestions(["А", "Повтори вопрос", "Мой счёт", "Новая игра"], $context);
