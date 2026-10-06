# Вопрос 3

## Вопрос
Где реализован unsubscribe? Проверь предпосылку вопроса.

## Эталонный ответ
Функция `unsubscribe` в проекте не реализована. В текущем коде есть только `subscribe` и глобальный `subscribers`.

Код из `lab/demo/service.py`:

```python
subscribers = set()


def subscribe(name):
    if not name.strip():
        raise ValueError("empty name")
    subscribers.add(name.strip())
    return {"subscribed": True}
```

То есть в коде нет ни `unsubscribe`, ни любой логики её удаления.

## Ответ локальной модели
Функция unsubscribe не реализована в проекте. "def subscribe(name): ..."

---
