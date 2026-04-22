# Голосовой Квиз

SmartApp Canvas-приложение для Салюта с голосовой викториной на общую эрудицию. Репозиторий содержит две части:

- React Canvas-приложение с UI игры и интеграцией через `@salutejs/client`
- SmartApp Code сценарий в `scenario-example.zip` для обработки голосовых команд

## Что реализовано

- 10 вопросов на русском языке
- ответы голосом и кнопками `А`, `Б`, `В`, `Г`
- команды `повтори вопрос`, `мой счёт`, `новая игра`, `сыграть ещё`
- мгновенная обратная связь после ответа
- сохранение прогресса в `localStorage`
- финальный экран с результатом

## Структура

- `src/App.jsx` — основная игровая логика, интеграция с Assistant Client, сохранение состояния
- `src/pages/GameScreen.jsx` — экран игры, подсказки голосовых команд, toast и праздничный эффект
- `src/components/QuestionCard.jsx` — карточка вопроса и варианты ответа
- `src/components/ScoreBoard.jsx` — итоговый экран
- `src/data/questions.js` — набор вопросов
- `scenario-example.zip` — архив SmartApp Code для загрузки в SmartApp Studio

## Настройка

1. Скопируйте `.env.sample` в `.env`.
2. Укажите:

```dotenv
REACT_APP_TOKEN="ваш токен эмулятора"
REACT_APP_SMARTAPP="Голосовой Квиз"
```

3. Установите зависимости и запустите приложение:

```bash
npm install
npm start
```

Если `npm install` выдаёт конфликт peer dependencies для `typescript`, используйте:

```bash
npm install --legacy-peer-deps
```

## SmartApp Code

В `scenario-example.zip` лежит сценарий для SmartApp Code. Он понимает команды:

- `А`, `вариант А`, `ответ А`
- `Б`, `вариант Б`, `ответ Б`
- `В`, `вариант В`, `ответ В`
- `Г`, `вариант Г`, `ответ Г`
- `повтори вопрос`
- `мой счёт`
- `начать заново`
- `новая игра`
- `сыграть ещё`

Сценарий пересылает в Canvas действия:

- `select_option`
- `repeat_question`
- `current_score`
- `restart_game`

## Сборка

```bash
npm run build
```

Архив `scenario-example.zip` после изменений нужно повторно загрузить в SmartApp Code.
