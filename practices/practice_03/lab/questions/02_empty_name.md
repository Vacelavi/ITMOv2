# Вопрос 2

## Вопрос
Что будет при пустом имени подписчика? Подтверди кодом.

## Эталонный ответ
При пустом имени вызывается исключение `ValueError("empty name")`.

Код из `lab/demo/service.py`:

```python
subscribers = set()


def subscribe(name):
    if not name.strip():
        raise ValueError("empty name")
    subscribers.add(name.strip())
    return {"subscribed": True}
```

Проверка есть и в `lab/demo/test_service.py`:

```python
def test_empty(self):
    with self.assertRaises(ValueError):
        subscribe(" ")
```

## Ответ локальной модели
Будет выброшено исключение ValueError("empty name"). "raise ValueError(\"empty name\")"
---
