from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Boardroom API",
    description="Каталог классических настольных игр.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


GAMES = [
    {
        "id": "chess",
        "name": "Шахматы",
        "eyebrow": "Стратегия",
        "description": "Классическая дуэль умов, где каждый ход меняет рисунок всей партии.",
        "players": "2 игрока",
        "duration": "10–60 мин",
        "difficulty": "Средняя",
        "accent": "ivory",
        "symbol": "♞",
        "rules": ["Защитите своего короля", "Поставьте мат королю соперника", "Продумывайте позицию на несколько ходов"],
    },
    {
        "id": "checkers",
        "name": "Шашки",
        "eyebrow": "Тактика",
        "description": "Быстрая и ясная игра про темп, комбинации и смелые прорывы в дамки.",
        "players": "2 игрока",
        "duration": "10–30 мин",
        "difficulty": "Лёгкая",
        "accent": "coral",
        "symbol": "⛀",
        "rules": ["Ходите по диагонали", "Перепрыгивайте и забирайте шашки", "Проведите шашку в дамки"],
    },
    {
        "id": "go",
        "name": "Го",
        "eyebrow": "Территория",
        "description": "Минимум правил, максимум глубины: окружайте пространство и сохраняйте свободу камней.",
        "players": "2 игрока",
        "duration": "20–90 мин",
        "difficulty": "Высокая",
        "accent": "sage",
        "symbol": "●",
        "rules": ["Ставьте камни на пересечения", "Окружайте территорию", "Не оставляйте группы без дыханий"],
    },
    {
        "id": "backgammon",
        "name": "Нарды",
        "eyebrow": "Риск и расчёт",
        "description": "Гонка фишек, в которой стратегия встречается с броском костей и искусством риска.",
        "players": "2 игрока",
        "duration": "15–45 мин",
        "difficulty": "Средняя",
        "accent": "gold",
        "symbol": "⚄",
        "rules": ["Бросайте две кости", "Проведите все шашки в дом", "Снимите их с доски раньше соперника"],
    },
]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/games")
def list_games() -> list[dict[str, object]]:
    return GAMES


@app.get("/api/games/{game_id}")
def get_game(game_id: str) -> dict[str, object]:
    game = next((item for item in GAMES if item["id"] == game_id), None)
    if game is None:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    return game

