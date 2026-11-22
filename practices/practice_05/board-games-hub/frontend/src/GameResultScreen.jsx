import { useEffect, useMemo, useRef } from 'react'
import { ArrowLeftIcon, RotateCcwIcon, TrophyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const gameNames = {
  chess: 'Шахматы',
  checkers: 'Шашки',
  go: 'Го',
  backgammon: 'Нарды',
}

export function formatDuration(value) {
  const safeSeconds = Number.isInteger(value) && value >= 0 ? value : 0
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Render a finished local game with safe display fallbacks.
 * @param {{ result: object, onRestart: () => void }} props
 */
export default function GameResultScreen({ result = {}, players = {}, onRestart = () => {}, onBack = () => {} }) {
  const headingRef = useRef(null)
  const gameName = gameNames[result.gameId] ?? 'Игра'
  const moveCount = Number.isInteger(result.moveCount) && result.moveCount >= 0 ? result.moveCount : 0
  const duration = formatDuration(result.durationSeconds)
  const isDraw = result.outcome === 'draw'
  const winnerLabel = result.winner === 'w' ? players.w || 'Светлые' : result.winner === 'b' ? players.b || 'Тёмные' : null
  const outcomeText = isDraw ? 'Ничья' : winnerLabel ? `Победитель: ${winnerLabel}` : 'Победитель не определён'

  const isMalformed = !gameNames[result.gameId]
    || !['win', 'draw'].includes(result.outcome)
    || (!isDraw && !winnerLabel)
    || !Number.isInteger(result.moveCount)
    || result.moveCount < 0
    || !Number.isInteger(result.durationSeconds)
    || result.durationSeconds < 0
    || !['king_captured', 'no_pieces', 'double_pass', 'bear_off'].includes(result.reason)

  const announcement = useMemo(
    () => `Итог партии. ${outcomeText}. Ходов: ${moveCount}. Время: ${duration}.`,
    [duration, moveCount, outcomeText],
  )

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (isMalformed) console.warn('Invalid GameResult payload; safe fallbacks were applied.')
  }, [isMalformed])

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10" id="play-room">
      <Card className="w-full max-w-3xl text-center [--card-spacing:--spacing(7)]" role="region" aria-label="Game result">
        <CardHeader className="items-center">
          <TrophyIcon className="size-10 text-accent-foreground" aria-hidden="true" />
          <Badge render={<h1 ref={headingRef} tabIndex={-1} />}>Партия завершена</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="sr-only" aria-live="polite">{announcement}</p>
          <div><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{gameName} · результат</p><h2 className="mt-2 font-heading text-5xl font-semibold sm:text-7xl">{outcomeText}</h2></div>
          <Separator />
          <dl className="grid grid-cols-2 gap-5" aria-label="Статистика партии">
            <div><dt className="text-sm text-muted-foreground">Ходов</dt><dd className="mt-1 text-3xl font-semibold">{moveCount}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Время</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{duration}</dd></div>
          </dl>
        </CardContent>
        <CardFooter className="flex-col justify-center gap-3 bg-transparent sm:flex-row">
          <Button size="lg" type="button" aria-label="Сыграть ещё раз" onClick={onRestart}><RotateCcwIcon data-icon="inline-start" aria-hidden="true" />Сыграть ещё раз</Button>
          <Button size="lg" type="button" variant="outline" onClick={onBack}><ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />К каталогу</Button>
        </CardFooter>
      </Card>
    </main>
  )
}

