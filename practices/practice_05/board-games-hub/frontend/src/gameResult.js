import { useCallback, useRef, useState } from 'react'

export const supportedReasons = Object.freeze({
  chess: 'king_captured',
  checkers: 'no_pieces',
  go: 'double_pass',
  backgammon: 'bear_off',
})

const defaultNow = () => performance.now()

/** Create the synchronous result state for one mounted local game board. */
export function createGameSession(gameId, now = defaultNow) {
  if (!supportedReasons[gameId]) throw new Error(`Unsupported gameId: ${gameId}`)

  let startedAtMs = now()
  let completedMoves = 0
  let finalResult = null

  return {
    get moveCount() {
      return completedMoves
    },
    get result() {
      return finalResult
    },
    completeMove() {
      if (finalResult) return completedMoves
      completedMoves += 1
      return completedMoves
    },
    finish({ outcome, winner, reason, moveCount = completedMoves }) {
      if (finalResult) return finalResult
      if (reason !== supportedReasons[gameId]) throw new Error(`Unsupported finish reason for ${gameId}: ${reason}`)
      if (!['win', 'draw'].includes(outcome)) throw new Error(`Unsupported outcome: ${outcome}`)
      if ((outcome === 'draw' && winner !== null) || (outcome === 'win' && !['w', 'b'].includes(winner))) {
        throw new Error('Winner does not match outcome')
      }
      if (!Number.isInteger(moveCount) || moveCount < 0) throw new Error('moveCount must be a non-negative integer')

      completedMoves = moveCount
      const elapsedMs = Math.max(0, now() - startedAtMs)
      finalResult = Object.freeze({
        gameId,
        outcome,
        winner,
        reason,
        moveCount,
        durationSeconds: Math.floor(elapsedMs / 1000),
      })
      return finalResult
    },
    reset() {
      startedAtMs = now()
      completedMoves = 0
      finalResult = null
    },
  }
}

export function useGameResultSession(gameId) {
  const sessionRef = useRef(null)
  if (!sessionRef.current) sessionRef.current = createGameSession(gameId)
  const [result, setResult] = useState(null)

  const completeMove = useCallback(() => sessionRef.current.completeMove(), [])
  const finish = useCallback((details) => {
    const nextResult = sessionRef.current.finish(details)
    setResult(nextResult)
    return nextResult
  }, [])
  const resetSession = useCallback(() => {
    sessionRef.current.reset()
    setResult(null)
  }, [])

  return { result, completeMove, finish, resetSession }
}

