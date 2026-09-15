# Журнал запросов и проверок

Не сохраняйте скрытую Chain of Thought и полный чат. Нужны запрос, краткий результат, ссылка на изменённый артефакт и ваша проверка.

| ID | Артефакт и цель | Инструмент / модель | Тип промпта | Запрос или ссылка на него | Результат или ссылка | Что приняли | Что отклонили или исправили | Как проверили |
|---|---|---|---|---|---|---|---|---|
| P1-01 | Baseline-ревью `TRAINING_PR.diff` | OpenCode gpt-5 | zero-shot | Файл: practices/practice_01/TRAINING_PR.diff | Итоги ревью: app/api.py — отсутствие валидации входа и обращение к payload["diff"] без проверки; app/review_service.py — отсутствие обработки ошибок LLM и риски prompt injection; детали ниже | Принято: 1) app/api.py: KeyError при отсутствии ключа 'diff' (должна быть схема/валидация) [стр. 35-38 diff]; 2) app/api.py: использование голого dict вместо Pydantic-модели ухудшает схему OpenAPI [стр. 35-38]; 3) app/review_service.py: отсутствует обработка исключений LLM.generate, потенциальный 500 [стр. 19-22]; 4) app/review_service.py: небезопасный/неограниченный ввод diff в prompt (риск prompt injection/DoS) [стр. 19-22] | Отклонено/понижено: 1) Изменение сигнатуры Protocol (...'ellipsis') — допустимо, не ошибка [стр. 9-13]; 2) sync endpoint без async — приемлемо для FastAPI (выполнится в threadpool) | Проверка: статический анализ diff с привязкой к строкам; сценарий воспроизведения KeyError — POST /api/reviews с {} приводит к KeyError (500), ожидаемое поведение — 422 с валидацией; проверка схемы — отсутствие Pydantic-модели скрывает поле в OpenAPI; анализ устойчивости — отсутствие try/except вокруг LLM.generate и отсутствия лимитов на размер diff |
| P1-02 | Повторное ревью с master prompt | OpenCode gpt-5 | master prompt | Role: AI-reviewer Inputs: TRAINING_PR.diff Case: summary + <= 3 risks + checks Risk: file:line + evidence + rule Forbidden: approve, merge; don't make any rules, don't delete already existing text from files Flow: candidate + evidence + check; no evidence -> skip Task: find risks and fill files: context.md, problem.md, prompts.md. Rule: Answer in russian Done: evidence + check for every risk| Checks: 1) POST /api/reviews с {} => 500 (ожидание 422) [app/api.py:35-38]; 2) симулировать LLM.generate, бросающий исключение => 500 [app/review_service.py:19-22]; 3) подать большой diff => деградация/ошибка [app/review_service.py:19-22] |
| P1-03 | Контрольная проверка и фиксация evidence | OpenCode gpt-5 | master prompt | Роль: AI-reviewer. Повторный прогон по TRAINING_PR.diff для подтверждения evidence и checks. | Summary: подтверждена воспроизводимость всех 3 рисков (валидация входа, устойчивость LLM, безопасность prompt). | Принято: 1) KeyError/500 при отсутствии diff [app/api.py:35-38]; 2) 500 при исключении LLM [app/review_service.py:19-22]; 3) риск DoS/prompt injection из-за неограниченного diff [app/review_service.py:19-22] | Отклонено/понижено: доп. риски без evidence — пропущены по правилу "no evidence -> skip" | Checks: 1) POST /api/reviews с {} => 500 (ожидание 422); 2) подменить LLM.generate на выбрасывающий исключение => 500; 3) отправить очень большой diff => деградация/ошибка |

## Master Prompt v1

Контракт второго запуска. Ссылки и минимальный контекст.

### 1. Цель и роль

- Цель: провести ревью TRAINING_PR.diff, выдать summary и ≤3 риска с evidence и воспроизводимыми проверками.
- Роль AI: AI-reviewer.

### 2. Входы и источники

- Обязательный вход: practices/practice_01/TRAINING_PR.diff
- Разрешённые файлы и источники: только diff и текущий репозиторий (app/api.py, app/review_service.py). Без внешних правил.
- Context Pack — факты, правила, примеры и ограничения: см. practices/practice_01/context.md (формат входа/выхода, ограничения: не approve/merge; no new rules; не удалять текст; формат ответа: candidate + evidence (file:line + цитата) + check).

### 3. Задача и артефакты

- Что сделать: найти и описать до 3 рисков, каждый с candidate, evidence (file:line + цитата/описание) и check. Если нет evidence — пропустить.
- Что вернуть: краткое summary и список рисков с checks.

### 4. Формат результата

- Структура ответа: summary; затем по каждому риску: candidate; evidence (file:line + отсылка на diff); rule (если применимо из контекста); check (воспроизводимая проверка).
- Ограничения объёма: не более 3 рисков.

### 5. Полномочия и запреты

- Разрешено: анализировать diff, ссылаться на строки файла, предлагать проверки.
- Запрещено: approve, merge; придумывать новые внешние правила; удалять существующий текст из файлов.

### 6. Рабочий процесс и остановка

- Шаги: прочитать diff; выделить кандидаты рисков; проверить, что для каждого есть evidence; сформулировать checks; зафиксировать в prompts.md (P1-02/P1-03), контекст — в context.md, проблему — в problem.md.
- Когда остановиться и запросить человека: при конфликте требований или невозможности воспроизвести check.

### 7. Проверки и evidence

- Как проверять утверждения: воспроизводимые сценарии (HTTP-запросы, подмена зависимостей) и ссылки на строки diff.
- Какое evidence сохранить: ссылки file:line и описание ожидаемого/фактического поведения.

### 8. Definition of Done

- Задача закончена, когда: в prompts.md добавлены P1-02 и P1-03; в context.md и problem.md зафиксированы контекст и метрики; для каждого риска есть evidence и check.

## Сравнение двух запусков

| Проверка | Zero-shot | С master prompt | Вывод команды |
|---|---|---|---|
| Есть ссылка на файл или строку | Да | Да | Оба запуска ссылаются на app/api.py:35-38, app/review_service.py:19-22 |
| Вывод подтверждён diff или правилом | Да | Да | Обоснование через diff и правила из context.md |
| Соблюдены границы AI | Да | Да | Нет approve/merge, нет новых правил, текст не удалён |
| Есть воспроизводимая проверка | Да | Да | POST {} -> 500; подмена LLM -> 500; большой diff -> деградация |

## Peer review

| Где другой команде пришлось догадываться | Что исправили | Если не исправили — почему |
|---|---|---|
| Неявный контракт входа/выхода | Добавили явное описание формата в context.md |  |
| Где искать строки в diff | Добавили ссылки file:line в prompts.md |  |
| Как воспроизвести 500 | Описали шаги checks в prompts.md |  |
