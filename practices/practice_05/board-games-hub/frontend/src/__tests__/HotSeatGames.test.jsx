import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import HotSeatGame from '../HotSeatGames.jsx'

describe('HotSeatGame result integration', () => {
  it('finishes an immediate Go double pass as a two-move draw', async () => {
    const user = userEvent.setup()
    render(<HotSeatGame gameId="go" />)

    await user.click(screen.getByRole('button', { name: 'Пас' }))
    await user.click(screen.getByRole('button', { name: 'Пас' }))

    expect(screen.getByRole('heading', { name: 'Партия завершена' })).toBeInTheDocument()
    expect(screen.getByText('Го · результат')).toBeInTheDocument()
    expect(screen.getByText('Ничья')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Пас' })).not.toBeInTheDocument()
  })

  it('does not count an invalid occupied-point action', async () => {
    const user = userEvent.setup()
    render(<HotSeatGame gameId="go" />)

    const point = screen.getByRole('gridcell', { name: /Пересечение 1:1/ })
    await user.click(point)
    await user.click(point)
    expect(screen.getByRole('status')).toHaveTextContent('Эта точка уже занята')
    await user.click(screen.getByRole('button', { name: 'Пас' }))
    await user.click(screen.getByRole('button', { name: 'Пас' }))

    expect(screen.getByText('Победитель: Тёмные')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('starts a clean game after Play Again', async () => {
    const user = userEvent.setup()
    render(<HotSeatGame gameId="go" />)
    await user.click(screen.getByRole('button', { name: 'Пас' }))
    await user.click(screen.getByRole('button', { name: 'Пас' }))
    await user.click(screen.getByRole('button', { name: 'Сыграть ещё раз' }))

    expect(screen.getByRole('button', { name: 'Пас' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Пас' }))
    await user.click(screen.getByRole('button', { name: 'Пас' }))
    expect(screen.getByText('Ничья')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('preserves chess move hints', async () => {
    const user = userEvent.setup()
    render(<HotSeatGame gameId="chess" />)
    await user.click(screen.getByRole('button', { name: '7:1' }))
    expect(screen.getByRole('button', { name: /6:1 доступная цель/ })).toHaveClass('hint')
  })
})

