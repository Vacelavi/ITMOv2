import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import GameResultScreen, { formatDuration } from '../GameResultScreen.jsx'

const result = {
  gameId: 'chess',
  outcome: 'win',
  winner: 'w',
  reason: 'king_captured',
  moveCount: 42,
  durationSeconds: 187,
}

describe('GameResultScreen', () => {
  it('shows a localized light-side win and formatted statistics', () => {
    render(<GameResultScreen result={result} onRestart={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Партия завершена' })).toBeInTheDocument()
    expect(screen.getByText('Шахматы · результат')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Победитель: Светлые' })).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('03:07')).toBeInTheDocument()
  })

  it('shows a dark-side win', () => {
    render(<GameResultScreen result={{ ...result, winner: 'b' }} onRestart={() => {}} />)
    expect(screen.getByText('Победитель: Тёмные')).toBeInTheDocument()
  })

  it('lets draw override contradictory winner data', () => {
    render(<GameResultScreen result={{ ...result, outcome: 'draw', winner: 'w' }} onRestart={() => {}} />)
    expect(screen.getByText('Ничья')).toBeInTheDocument()
    expect(screen.queryByText(/Победитель:/)).not.toBeInTheDocument()
  })

  it('uses safe fallbacks and never displays an unknown reason', () => {
    render(<GameResultScreen result={{ gameId: 'future', outcome: 'win', winner: 'x', reason: 'future_reason', moveCount: -2, durationSeconds: NaN }} onRestart={() => {}} />)

    expect(screen.getByText('Игра · результат')).toBeInTheDocument()
    expect(screen.getByText('Победитель не определён')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.queryByText('future_reason')).not.toBeInTheDocument()
  })

  it('formats durations without truncating minutes', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(187)).toBe('03:07')
    expect(formatDuration(7425)).toBe('123:45')
    expect(formatDuration(-1)).toBe('00:00')
  })

  it('focuses the result heading and invokes restart once', async () => {
    const user = userEvent.setup()
    const onRestart = vi.fn()
    render(<GameResultScreen result={result} onRestart={onRestart} />)

    const region = screen.getByRole('region', { name: 'Game result' })
    const heading = screen.getByRole('heading', { name: 'Партия завершена' })
    expect(region).toBeInTheDocument()
    expect(heading).toHaveFocus()
    expect(region).toHaveTextContent('Итог партии. Победитель: Светлые. Ходов: 42. Время: 03:07.')

    await user.tab()
    const restart = screen.getByRole('button', { name: 'Сыграть ещё раз' })
    expect(restart).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRestart).toHaveBeenCalledTimes(1)
  })
})

