# Integration-проверки

| Связь компонентов | Что может сломаться | Как воспроизводим | Ожидаемый результат | Evidence |
|---|---|---|---|---|
| API -> ReviewService | Отсутствие diff | POST {} | 422 | app/api.py:35-38 |
| ReviewService -> LLM | Исключение LLM | Подмена generate на raise | Контролируемый ответ | app/review_service.py:19-22 |

## Как использовали AI

- Строка в [`prompts.md`](prompts.md):
- Что проверили и исправили сами:
 - Строка в [`prompts.md`](prompts.md): P1-03
 - Что проверили и исправили сами: связи и негативные сценарии по diff
