# Голосовой Квиз

SmartApp Canvas-приложение для Салюта с голосовой викториной на общую эрудицию. Проект состоит из двух частей:

- `src/` — React Canvas-приложение с UI, игровой логикой и интеграцией через `@salutejs/client`
- `scenario/` — SmartApp Code сценарий, который принимает голосовые команды и отправляет действия в Canvas

`todo-canvas-app/` оставлен в репозитории как эталонный пример рабочего SmartApp со связкой Canvas + Code.

## Возможности

- банк из 20 вопросов на русском языке
- 10 случайных вопросов в каждой новой сессии
- ответы голосом и кнопками `1`, `2`, `3`, `4`
- команды `повтори вопрос`, `мой счёт`, `начать заново`, `новая игра`, `сыграть ещё`
- озвучивание вопроса и ответов через SmartApp Code
- подсветка правильного и ошибочного ответа
- новая сессия при каждом запуске сайта
- финальный экран с результатом

## Структура проекта

- `src/App.jsx` — основная игровая логика, state игры и интеграция с Assistant Client
- `src/pages/GameScreen.jsx` — главный экран квиза
- `src/components/QuestionCard.jsx` — карточка текущего вопроса
- `src/components/ScoreBoard.jsx` — итоговый экран
- `src/data/questions.js` — набор вопросов
- `scenario/src/entryPoint.sc` — главный сценарный файл SmartApp Code
- `scenario/src/sc/*.sc` — голосовые сценарии
- `scenario/src/js/*.js` — вспомогательные JS-функции для SmartApp Code
- `todo-canvas-app/` — пример исходного рабочего приложения

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

Если есть конфликт peer dependencies, используйте:

```bash
npm install --legacy-peer-deps
```

2. Скопируйте `.env.sample` в `.env`.

3. Заполните переменные:

```dotenv
REACT_APP_TOKEN=""
REACT_APP_SMARTAPP="Quiz"
# REACT_APP_VOICE_DEBUG="true"
```

`REACT_APP_TOKEN` нужен для локального запуска через SmartApp Debugger.  
`REACT_APP_SMARTAPP` должен совпадать с именем SmartApp в сценарии `scenario/chatbot.yaml`.
`REACT_APP_VOICE_DEBUG="true"` включает компактные логи voice scheduler: очередь, отправку, прерывания и устаревшие callbacks.

4. Запустите приложение:

```bash
npm start
```

5. Для production-сборки:

```bash
npm run build
```

## Голосовые команды

Поддерживаются команды:

- `1`, `один`, `первый`, `номер 1`, `вариант 1`, `ответ 1`
- `2`, `два`, `второй`, `номер 2`, `вариант 2`, `ответ 2`
- `3`, `три`, `третий`, `номер 3`, `вариант 3`, `ответ 3`
- `4`, `четыре`, `четвёртый`, `номер 4`, `вариант 4`, `ответ 4`
- `повтори вопрос`
- `мой счёт`
- `начать заново`
- `новая игра`
- `сыграть ещё`

На стороне SmartApp Code они преобразуются в действия:

- `select_option`
- `repeat_question`
- `current_score`
- `restart_game`

## SmartApp Code

Для загрузки в SmartApp Studio используйте содержимое папки `scenario/`.  
В репозитории также лежит архив `scenario.zip`, но исходником считается именно директория `scenario/`.

Ключевые файлы:

- `scenario/chatbot.yaml` — имя приложения, язык, entry point и настройки движка
- `scenario/src/entryPoint.sc` — старт и fallback
- `scenario/src/sc/gameCommands.sc` — голосовые команды пользователя
- `scenario/src/sc/gameEvents.sc` — озвучивание событий, отправленных из Canvas
- `scenario/src/js/contract.js` — общий набор action/event id для сценария

## Диагностика текущего состояния

На дату `2026-04-25`:

- `npm run build` проходит успешно
- `npx react-scripts test --watchAll=false` проходит успешно
- есть тесты игрового движка, voice contract, voice queue и voice scheduler

Сценарные тесты SmartApp Code в `scenario/test/test.xml` пока минимальные; реальную TTS-связку всё равно нужно проверять в SmartApp Debugger или на устройстве.
