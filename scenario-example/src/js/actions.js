function selectOption(option, context) {
    addAction({
        type: "select_option",
        option: option
    }, context);
}

function repeatQuestion(context) {
    addAction({
        type: "repeat_question"
    }, context);
}

function requestCurrentScore(context) {
    addAction({
        type: "current_score"
    }, context);
}

function restartGame(context) {
    addAction({
        type: "restart_game"
    }, context);
}
