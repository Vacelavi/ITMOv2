# E2E-проверки

| Сценарий пользователя | Предусловия | Действие | Наблюдаемый результат | Evidence |
|---|---|---|---|---|
| Позитивный | Валидный JSON с diff | POST /api/reviews | 200 и {comment} | app/api.py:35-38 |
| Негативный | Пустой JSON {} | POST /api/reviews | 422 | app/api.py:35-38 |
| Граничный | Очень большой diff | POST /api/reviews | 413/422 или контролируемая ошибка | app/review_service.py:19-22 |

## Как использовали AI

- Строка в [`prompts.md`](prompts.md):
- Что проверили и исправили сами:
 - Строка в [`prompts.md`](prompts.md): P1-03
 - Что проверили и исправили сами: сценарии e2e совпадают с risks/checks
