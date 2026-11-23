import { expect, test } from '@playwright/test'

const games = [
  {
    id: 'chess',
    name: 'Шахматы',
    eyebrow: 'Стратегия',
    description: 'Классическая дуэль умов, где каждый ход меняет рисунок всей партии.',
    players: '2 игрока',
    duration: '10–60 мин',
    difficulty: 'Средняя',
    rules: ['Защитите своего короля', 'Поставьте мат королю соперника'],
  },
  {
    id: 'checkers',
    name: 'Шашки',
    eyebrow: 'Тактика',
    description: 'Быстрая и ясная игра про темп, комбинации и смелые прорывы в дамки.',
    players: '2 игрока',
    duration: '10–30 мин',
    difficulty: 'Лёгкая',
    rules: ['Ходите по диагонали', 'Перепрыгивайте и забирайте шашки'],
  },
  {
    id: 'go',
    name: 'Го',
    eyebrow: 'Территория',
    description: 'Минимум правил, максимум глубины: окружайте пространство и сохраняйте свободу камней.',
    players: '2 игрока',
    duration: '20–90 мин',
    difficulty: 'Высокая',
    rules: ['Ставьте камни на пересечения', 'Окружайте территорию'],
  },
  {
    id: 'backgammon',
    name: 'Нарды',
    eyebrow: 'Риск и расчёт',
    description: 'Гонка фишек, в которой стратегия встречается с броском костей и искусством риска.',
    players: '2 игрока',
    duration: '15–45 мин',
    difficulty: 'Средняя',
    rules: ['Бросайте две кости', 'Проведите все шашки в дом'],
  },
]

async function waitForStableRender(page) {
  await page.evaluate(() => document.fonts.ready)
}

async function mockCatalog(page) {
  await page.route('**/api/games', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: games })
  })
}

test('catalog', async ({ page }) => {
  await mockCatalog(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Играть в «Го»' })).toBeVisible()
  await waitForStableRender(page)
  await expect(page).toHaveScreenshot('catalog.png', { fullPage: true })
})

test('game details dialog', async ({ page }) => {
  await mockCatalog(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Открыть подробности игры «Го»' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await waitForStableRender(page)
  await expect(page).toHaveScreenshot('details-dialog.png', { fullPage: true })
})

for (const state of ['loading', 'empty', 'error']) {
  test(`catalog ${state} state`, async ({ page }) => {
    await page.goto(`/?demo=${state}`)
    await waitForStableRender(page)
    await expect(page).toHaveScreenshot(`catalog-${state}.png`, { fullPage: true })
  })
}

test('Go board', async ({ page }) => {
  await page.goto('/?demo=go')
  await expect(page.getByRole('grid', { name: 'Игровая доска Го, 9 на 9' })).toBeVisible()
  await waitForStableRender(page)
  await expect(page).toHaveScreenshot('go-board.png', { fullPage: true })
})

test('game result', async ({ page }) => {
  await page.goto('/?demo=result')
  await expect(page.getByRole('heading', { name: 'Партия завершена' })).toBeVisible()
  await waitForStableRender(page)
  await expect(page).toHaveScreenshot('result.png', { fullPage: true })
})
