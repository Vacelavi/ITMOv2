# Вопрос 1

## Вопрос
Как запустить тесты? Укажи файл-источник.

## Эталонный ответ
Тесты запускаются командой:

```bash
cd /home/vacelavi/ITMO/ai_avito/ITMOv2/practices/practice_03/lab
make test
```

Источник: `lab/Makefile`:

```make
.PHONY: install test
install:
	@python3 -c "import sys; assert sys.version_info >= (3,10), 'Python 3.10+ required'; print('Standard library only: ready')"
test: install
	$(MAKE) -C demo test
```

Это вызывает `make -C demo test`, а в `demo/` тесты запускаются через `python3 -m unittest -v`.

## Ответ локальной модели

grep -r "test" --include="*.md" 

---