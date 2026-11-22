import { describe, expect, it } from 'vitest'
import { createGameSession } from '../gameResult.js'

const reasons = {
  chess: 'king_captured',
  checkers: 'no_pieces',
  go: 'double_pass',
  backgammon: 'bear_off',
}

describe('createGameSession', () => {
  it.each(Object.entries(reasons))('creates the %s result only with its supported reason', (gameId, reason) => {
    const session = createGameSession(gameId, () => 0)
    const count = session.completeMove()
    const result = session.finish({ outcome: 'win', winner: 'w', reason, moveCount: count })

    expect(result).toEqual({ gameId, outcome: 'win', winner: 'w', reason, moveCount: 1, durationSeconds: 0 })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('rejects a reason that does not belong to the game', () => {
    const session = createGameSession('chess', () => 0)
    expect(() => session.finish({ outcome: 'win', winner: 'w', reason: 'double_pass' })).toThrow(/reason/i)
  })

  it('counts completed moves synchronously and includes the terminal move', () => {
    const session = createGameSession('go', () => 0)
    expect(session.completeMove()).toBe(1)
    expect(session.completeMove()).toBe(2)
    expect(session.moveCount).toBe(2)
    expect(session.finish({ outcome: 'draw', winner: null, reason: 'double_pass' }).moveCount).toBe(2)
  })

  it('uses monotonic elapsed full seconds and ignores duplicate finish', () => {
    let now = 1000
    const session = createGameSession('go', () => now)
    session.completeMove()
    session.completeMove()
    now = 3999
    const first = session.finish({ outcome: 'draw', winner: null, reason: 'double_pass' })
    now = 9000
    const second = session.finish({ outcome: 'win', winner: 'b', reason: 'double_pass' })

    expect(first.durationSeconds).toBe(2)
    expect(second).toBe(first)
    expect(second.durationSeconds).toBe(2)
  })

  it('resets count, result, and the timer origin', () => {
    let now = 0
    const session = createGameSession('go', () => now)
    session.completeMove()
    session.finish({ outcome: 'win', winner: 'b', reason: 'double_pass' })
    now = 5000
    session.reset()
    expect(session.moveCount).toBe(0)
    expect(session.result).toBeNull()
    now = 6200
    expect(session.finish({ outcome: 'draw', winner: null, reason: 'double_pass' }).durationSeconds).toBe(1)
  })
})

