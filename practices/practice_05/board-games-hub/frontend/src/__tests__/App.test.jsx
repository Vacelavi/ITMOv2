import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'

const go = {
  id: 'go',
  name: 'Го',
  eyebrow: 'Территория, влияние и тишина',
  description: 'Древняя игра с предельно ясными правилами и почти бесконечной глубиной.',
  players: '2 игрока',
  duration: '20–45 мин',
  difficulty: 'Средняя',
  rules: [
    'Чёрные ходят первыми, затем игроки чередуются.',
    'Камни ставятся на свободные пересечения линий.',
    'Игрок может спасовать. Два паса подряд завершают партию.',
  ],
}

const chess = {
  ...go,
  id: 'chess',
  name: 'Шахматы',
  eyebrow: 'Стратегия без случайностей',
  duration: '30–90 мин',
}

const response = (data, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(data) })

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('Boardroom v0 interface with real API contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the v0 loading state and then renders API games', async () => {
    const pendingCatalog = deferred()
    fetch.mockReturnValueOnce(pendingCatalog.promise)
    render(<App />)

    expect(screen.getByRole('heading', { name: /Игры для\s*двух умов/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Загрузка каталога')).toBeInTheDocument()

    await act(async () => pendingCatalog.resolve(await response([go, chess])))

    expect(await screen.findByRole('button', { name: 'Играть в «Го»' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Открыть подробности игры «Шахматы»' })).toBeInTheDocument()
  })

  it('shows an empty catalog returned by the server', async () => {
    fetch.mockReturnValueOnce(response([]))
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Игры пока не добавлены' })).toBeInTheDocument()
    expect(screen.getByText(/готовим подборку классических игр/i)).toBeInTheDocument()
  })

  it('shows a catalog error and successfully retries', async () => {
    const user = userEvent.setup()
    fetch.mockRejectedValueOnce(new Error('offline')).mockReturnValueOnce(response([go]))
    render(<App />)

    expect(await screen.findByText('Не удалось загрузить каталог')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByRole('button', { name: 'Играть в «Го»' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('opens and closes details, expands rules, and validates player names', async () => {
    const user = userEvent.setup()
    fetch.mockReturnValueOnce(response([go]))
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Открыть подробности игры «Го»' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Го' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Как играть' }))
    expect(screen.getByText('Камни ставятся на свободные пересечения линий.')).toBeInTheDocument()

    const darkPlayer = screen.getByLabelText('Игрок за чёрных')
    const lightPlayer = screen.getByLabelText('Игрок за белых')
    await user.clear(darkPlayer)
    await user.click(screen.getByRole('button', { name: 'Начать партию' }))
    expect(screen.getByText('Введите имя игрока.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)

    await user.type(darkPlayer, 'А')
    await user.click(screen.getByRole('button', { name: 'Начать партию' }))
    expect(screen.getByText('Имя должно содержать минимум 2 символа.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)

    await user.clear(darkPlayer)
    await user.type(darkPlayer, 'Анна')
    await user.clear(lightPlayer)
    await user.type(lightPlayer, 'Анна')
    await user.click(screen.getByRole('button', { name: 'Начать партию' }))
    expect(screen.getByText('Имена игроков должны отличаться.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Вернуться' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not send a second launch request while the first one is pending', async () => {
    const user = userEvent.setup()
    const pendingLaunch = deferred()
    fetch.mockImplementation((url) => url === '/api/games' ? response([go]) : pendingLaunch.promise)
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Открыть подробности игры «Го»' }))

    const start = screen.getByRole('button', { name: 'Начать партию' })
    const form = start.closest('form')
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(screen.getByRole('button', { name: 'Загружаем настройки игры…' })).toBeDisabled()
    expect(fetch.mock.calls.filter(([url]) => url === '/api/games/go')).toHaveLength(1)

    await act(async () => pendingLaunch.resolve(await response(go)))
    expect(await screen.findByRole('heading', { name: 'Го · доска 9×9' })).toBeInTheDocument()
  })

  it('shows a launch error and lets the user retry', async () => {
    const user = userEvent.setup()
    fetch
      .mockReturnValueOnce(response([go]))
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockReturnValueOnce(response(go))
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Открыть подробности игры «Го»' }))
    await user.click(screen.getByRole('button', { name: 'Начать партию' }))

    expect(await screen.findByText('Не удалось начать партию')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить попытку' }))

    expect(await screen.findByRole('heading', { name: 'Го · доска 9×9' })).toBeInTheDocument()
  })

  it('runs the main scenario from quick play through two passes and replay', async () => {
    const user = userEvent.setup()
    fetch.mockImplementation((url) => url === '/api/games' ? response([go]) : response(go))
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Играть в «Го»' }))
    expect(await screen.findByRole('heading', { name: 'Го · доска 9×9' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Игровая доска Го, 9 на 9' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Пас' }))
    await user.click(screen.getByRole('button', { name: 'Пас' }))

    expect(screen.getByRole('heading', { name: 'Партия завершена' })).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Ничья' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Сыграть ещё раз' }))
    expect(screen.getByRole('grid', { name: 'Игровая доска Го, 9 на 9' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'К каталогу' }))
    expect(await screen.findByRole('heading', { name: /Игры для\s*двух умов/ })).toBeInTheDocument()
  })
})
