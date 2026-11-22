import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  Clock3Icon,
  GaugeIcon,
  Gamepad2Icon,
  PlayIcon,
  RefreshCwIcon,
  UsersIcon,
} from 'lucide-react'
import HotSeatGame from './HotSeatGames.jsx'
import GameResultScreen from './GameResultScreen.jsx'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const defaultPlayers = Object.freeze({ b: 'Чёрные', w: 'Белые' })
const chessPreview = [
  ...'♜♞♝♛♚♝♞♜',
  ...'♟♟♟♟♟♟♟♟',
  ...Array(32).fill(''),
  ...'♙♙♙♙♙♙♙♙',
  ...'♖♘♗♕♔♗♘♖',
]
const checkerPreview = { 9: 'white', 11: 'white', 18: 'white', 45: 'black', 52: 'black', 54: 'black' }
const goPreview = { 9: 'black', 18: 'white', 31: 'black', 39: 'white' }
const backgammonPreview = {
  top: { 0: { color: 'white', count: 2 }, 5: { color: 'black', count: 4 }, 7: { color: 'black', count: 3 }, 11: { color: 'white', count: 2 } },
  bottom: { 0: { color: 'black', count: 2 }, 4: { color: 'white', count: 3 }, 6: { color: 'white', count: 4 }, 11: { color: 'black', count: 2 } },
}

async function requestJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function gameTitle(game) {
  return game?.title || game?.name || 'Игра'
}

function gameSubtitle(game) {
  return game?.subtitle || game?.eyebrow || 'Классическая игра'
}

function BackgammonPreviewHalf({ side }) {
  return (
    <div className={`backgammon-half backgammon-half--${side}`}>
      {Array.from({ length: 12 }, (_, index) => {
        const stack = backgammonPreview[side][index]
        return (
          <span className="backgammon-point" key={index}>
            <span className="backgammon-triangle" />
            {stack && <span className={`backgammon-stack backgammon-stack--${stack.color}`}>{Array.from({ length: stack.count }, (_, piece) => <span key={piece} />)}</span>}
          </span>
        )
      })}
    </div>
  )
}

function BoardPreview({ gameId }) {
  if (gameId === 'chess') {
    return (
      <div className="game-motif game-motif--chess" role="img" aria-label="Шахматная позиция на доске">
        <div className="chess-preview" aria-hidden="true">
          {chessPreview.map((piece, index) => <span key={index} className={index < 16 ? 'preview-black' : index > 47 ? 'preview-white' : ''}>{piece}</span>)}
        </div>
      </div>
    )
  }

  if (gameId === 'checkers') {
    return (
      <div className="game-motif game-motif--checkers" role="img" aria-label="Белые и чёрные шашки на чёрных клетках">
        <div className="checkers-preview" aria-hidden="true">
          {Array.from({ length: 64 }, (_, index) => <span className="checkers-square" key={index}>{checkerPreview[index] && <i className={`checker checker--${checkerPreview[index]}`} />}</span>)}
        </div>
      </div>
    )
  }

  if (gameId === 'go') {
    return (
      <div className="game-motif game-motif--go" role="img" aria-label="Белые и чёрные камни на пересечениях доски Го">
        <div className="go-preview" aria-hidden="true">
          {Array.from({ length: 49 }, (_, index) => <span className="go-preview-point" key={index}>{goPreview[index] && <i className={`go-preview-stone go-preview-stone--${goPreview[index]}`} />}</span>)}
        </div>
      </div>
    )
  }

  return (
    <div className="game-motif game-motif--backgammon" role="img" aria-label="Доска для нард с пунктами и шашками">
      <div className="backgammon-preview" aria-hidden="true">
        <BackgammonPreviewHalf side="top" />
        <span className="backgammon-bar" />
        <BackgammonPreviewHalf side="bottom" />
      </div>
    </div>
  )
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Загрузка каталога" aria-live="polite">
      {Array.from({ length: 4 }, (_, index) => (
        <Card aria-hidden="true" key={index}>
          <CardContent className="-mx-(--card-spacing) -mt-(--card-spacing)"><Skeleton className="h-48 rounded-none" /></CardContent>
          <CardHeader className="gap-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" /></CardHeader>
          <CardContent className="flex flex-col gap-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
          <CardFooter><Skeleton className="ml-auto h-8 w-24" /></CardFooter>
        </Card>
      ))}
      <span className="sr-only">Загружаем игры…</span>
    </div>
  )
}

function EmptyCatalog() {
  return (
    <Card className="mx-auto w-full max-w-2xl py-14 text-center">
      <CardHeader><Gamepad2Icon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /></CardHeader>
      <CardContent className="flex flex-col gap-3"><h2 className="font-heading text-4xl font-semibold">Игры пока не добавлены</h2><p className="text-muted-foreground">Мы готовим подборку классических игр для совместного вечера.</p></CardContent>
    </Card>
  )
}

function GameCard({ game, launching, onDetails, onQuickPlay }) {
  const title = gameTitle(game)
  return (
    <Card className="group h-full bg-card transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none">
      <CardContent className="-mx-(--card-spacing) -mt-(--card-spacing)"><BoardPreview gameId={game.id} /></CardContent>
      <CardHeader>
        <CardTitle className="font-heading text-3xl font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{gameSubtitle(game)}</CardDescription>
        <CardAction><Badge variant={game.id === 'go' ? 'default' : 'outline'}>{game.id === 'go' ? 'Выбор редакции' : 'Классика'}</Badge></CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="leading-relaxed text-muted-foreground">{game.description}</p>
        <div className="flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="flex items-center gap-1.5"><UsersIcon aria-hidden="true" />{game.players}</span>
          <span className="flex items-center gap-1.5"><Clock3Icon aria-hidden="true" />{game.duration}</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between bg-transparent">
        <Button disabled={launching} aria-label={`Играть в «${title}»`} onClick={() => onQuickPlay(game)}>
          {launching ? <RefreshCwIcon className="animate-spin motion-reduce:animate-none" data-icon="inline-start" aria-hidden="true" /> : <PlayIcon data-icon="inline-start" aria-hidden="true" />}
          {launching ? 'Загрузка…' : 'Играть'}
        </Button>
        <Button disabled={launching} aria-label={`Открыть подробности игры «${title}»`} onClick={() => onDetails(game)} variant="ghost">
          Подробнее <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function validatePlayers(values) {
  const errors = {}
  const normalized = { b: values.b.trim(), w: values.w.trim() }
  for (const [key, value] of Object.entries(normalized)) {
    if (!value) errors[key] = 'Введите имя игрока.'
    else if (value.length < 2) errors[key] = 'Имя должно содержать минимум 2 символа.'
    else if (value.length > 24) errors[key] = 'Имя должно содержать не более 24 символов.'
  }
  if (!errors.b && !errors.w && normalized.b.toLocaleLowerCase('ru') === normalized.w.toLocaleLowerCase('ru')) errors.w = 'Имена игроков должны отличаться.'
  return { errors, normalized }
}

function GameDetailsDialog({ game, open, launchState, onOpenChange, onStart }) {
  const [players, setPlayers] = useState(defaultPlayers)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setPlayers(defaultPlayers)
      setErrors({})
    }
  }, [game?.id, open])

  if (!game) return null
  const title = gameTitle(game)

  const updatePlayer = (side, value) => {
    setPlayers((current) => ({ ...current, [side]: value }))
    setErrors((current) => ({ ...current, [side]: undefined }))
  }

  const submit = (event) => {
    event.preventDefault()
    if (launchState === 'loading') return
    const result = validatePlayers(players)
    setErrors(result.errors)
    if (Object.keys(result.errors).length === 0) onStart(game, result.normalized, 'details')
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => launchState !== 'loading' && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[min(88vh,760px)] overflow-y-auto sm:max-w-2xl">
        <form className="contents" onSubmit={submit} noValidate aria-busy={launchState === 'loading'}>
          <DialogHeader className="pr-8">
            <Badge variant="outline" className="w-fit">Классическая игра</Badge>
            <DialogTitle className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">{title}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">{game.description}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-1"><UsersIcon aria-hidden="true" /><span className="text-muted-foreground">Игроки</span><strong>{game.players}</strong></div>
            <div className="flex flex-col gap-1"><Clock3Icon aria-hidden="true" /><span className="text-muted-foreground">Время</span><strong>{game.duration}</strong></div>
            <div className="flex flex-col gap-1"><GaugeIcon aria-hidden="true" /><span className="text-muted-foreground">Сложность</span><strong>{game.difficulty}</strong></div>
          </div>

          <Accordion><AccordionItem value="rules"><AccordionTrigger className="text-base">Как играть</AccordionTrigger><AccordionContent><ol className="flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">{game.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol></AccordionContent></AccordionItem></Accordion>

          <fieldset className="grid gap-3" disabled={launchState === 'loading'}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Игроки за одним экраном</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label htmlFor="dark-player">Игрок за чёрных</Label><Input id="dark-player" value={players.b} maxLength={24} aria-invalid={Boolean(errors.b)} aria-describedby={errors.b ? 'dark-player-error' : undefined} onChange={(event) => updatePlayer('b', event.target.value)} />{errors.b && <p className="text-xs text-destructive" id="dark-player-error" role="alert">{errors.b}</p>}</div>
              <div className="grid gap-1.5"><Label htmlFor="light-player">Игрок за белых</Label><Input id="light-player" value={players.w} maxLength={24} aria-invalid={Boolean(errors.w)} aria-describedby={errors.w ? 'light-player-error' : undefined} onChange={(event) => updatePlayer('w', event.target.value)} />{errors.w && <p className="text-xs text-destructive" id="light-player-error" role="alert">{errors.w}</p>}</div>
            </div>
          </fieldset>

          <span className="sr-only" aria-live="polite">{launchState === 'loading' ? 'Загружаем настройки игры…' : ''}</span>
          {launchState === 'error' && <Alert variant="destructive" aria-live="assertive"><AlertTitle>Не удалось начать партию</AlertTitle><AlertDescription>Настройки игры не загрузились. Попробуйте ещё раз.</AlertDescription></Alert>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={launchState === 'loading'} onClick={() => onOpenChange(false)}><ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />Вернуться</Button>
            <Button type="submit" disabled={launchState === 'loading'}>
              {launchState === 'loading' ? <RefreshCwIcon className="animate-spin motion-reduce:animate-none" data-icon="inline-start" aria-hidden="true" /> : <PlayIcon data-icon="inline-start" aria-hidden="true" />}
              {launchState === 'loading' ? 'Загружаем настройки игры…' : launchState === 'error' ? 'Повторить попытку' : 'Начать партию'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function App() {
  const demoMode = import.meta.env.DEV && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demo') : null
  const [games, setGames] = useState([])
  const [catalogStatus, setCatalogStatus] = useState(['loading', 'empty', 'error'].includes(demoMode) ? demoMode : 'loading')
  const [selected, setSelected] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const [players, setPlayers] = useState(defaultPlayers)
  const [launchState, setLaunchState] = useState('idle')
  const [launchSource, setLaunchSource] = useState(null)
  const [launchingId, setLaunchingId] = useState(null)
  const [quickLaunchRequest, setQuickLaunchRequest] = useState(null)
  const catalogControllerRef = useRef(null)
  const launchControllerRef = useRef(null)
  const launchLockRef = useRef(false)

  const loadCatalog = useCallback(async () => {
    catalogControllerRef.current?.abort()
    const controller = new AbortController()
    catalogControllerRef.current = controller
    setCatalogStatus('loading')
    try {
      const data = await requestJson('/api/games', controller.signal)
      if (!Array.isArray(data)) throw new Error('Некорректный формат каталога')
      setGames(data)
      setCatalogStatus(data.length ? 'success' : 'empty')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setGames([])
        setCatalogStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    if (['loading', 'empty', 'error', 'go', 'result'].includes(demoMode)) return undefined
    loadCatalog()
    return () => {
      catalogControllerRef.current?.abort()
      launchControllerRef.current?.abort()
    }
  }, [demoMode, loadCatalog])

  const showDetails = (game) => {
    if (launchState === 'loading') return
    setSelected(game)
    setLaunchState('idle')
    setLaunchSource(null)
    setQuickLaunchRequest(null)
    setDialogOpen(true)
  }

  const startGame = async (game, nextPlayers = defaultPlayers, source = 'quick') => {
    if (!game || launchLockRef.current) return
    launchLockRef.current = true
    launchControllerRef.current?.abort()
    const controller = new AbortController()
    launchControllerRef.current = controller
    setLaunchState('loading')
    setLaunchSource(source)
    setLaunchingId(game.id)
    setQuickLaunchRequest(source === 'quick' ? { game, players: nextPlayers } : null)
    try {
      const loadedGame = await requestJson(`/api/games/${game.id}`, controller.signal)
      if (!loadedGame || loadedGame.id !== game.id) throw new Error('Некорректные настройки игры')
      setSelected(game)
      setPlayers(nextPlayers)
      setPlayingId(game.id)
      setDialogOpen(false)
      setLaunchState('idle')
      setLaunchSource(null)
      setQuickLaunchRequest(null)
    } catch (error) {
      if (error.name !== 'AbortError') setLaunchState('error')
    } finally {
      launchLockRef.current = false
      setLaunchingId(null)
    }
  }

  const backToCatalog = () => {
    setPlayingId(null)
    setLaunchState('idle')
    setLaunchSource(null)
  }

  if (demoMode === 'go') return <HotSeatGame gameId="go" players={defaultPlayers} />
  if (demoMode === 'result') return <GameResultScreen result={{ gameId: 'go', outcome: 'win', winner: 'b', reason: 'double_pass', moveCount: 24, durationSeconds: 318 }} players={defaultPlayers} />
  if (playingId) return <HotSeatGame key={`${playingId}-${players.b}-${players.w}`} gameId={playingId} players={players} onBack={backToCatalog} />

  return (
    <>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:gap-12">
          <header className="grid gap-7 border-b border-foreground/15 pb-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-accent-foreground">Boardroom · выпуск 01</p><h1 className="font-heading text-6xl font-semibold leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:text-8xl">Игры для<br />двух умов</h1></div>
            <div className="max-w-2xl lg:justify-self-end"><p className="font-heading text-2xl leading-snug sm:text-3xl">Один экран. Два игрока. Четыре вечные игры, в которых всё решает ваш следующий ход.</p><p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">Выберите игру, передайте устройство друг другу и проведите локальную партию без регистрации, ожидания и лишних настроек.</p></div>
          </header>

          <section aria-labelledby="catalog-title" className="flex flex-col gap-6" aria-busy={catalogStatus === 'loading'}>
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Коллекция</p><h2 id="catalog-title" className="font-heading text-4xl font-semibold sm:text-5xl">Выберите игру</h2></div><Badge variant="outline">4 классические игры</Badge></div>
            {catalogStatus === 'loading' && <CatalogSkeleton />}
            {catalogStatus === 'empty' && <EmptyCatalog />}
            {catalogStatus === 'error' && <Alert variant="destructive" className="mx-auto w-full max-w-2xl p-5" aria-live="assertive"><AlertTitle>Не удалось загрузить каталог</AlertTitle><AlertDescription>Проверьте соединение и попробуйте ещё раз.</AlertDescription><div className="mt-3"><Button variant="outline" onClick={loadCatalog}><RefreshCwIcon data-icon="inline-start" aria-hidden="true" />Повторить</Button></div></Alert>}
            {catalogStatus === 'success' && <>
              {launchState === 'error' && launchSource === 'quick' && <Alert variant="destructive" className="mx-auto w-full max-w-2xl p-5" aria-live="assertive"><AlertTitle>Не удалось начать партию</AlertTitle><AlertDescription>Настройки игры не загрузились. Попробуйте ещё раз.</AlertDescription><div className="mt-3"><Button variant="outline" onClick={() => quickLaunchRequest && startGame(quickLaunchRequest.game, quickLaunchRequest.players, 'quick')}><RefreshCwIcon data-icon="inline-start" aria-hidden="true" />Повторить попытку</Button></div></Alert>}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{games.map((game) => <GameCard game={game} launching={launchState === 'loading' && launchingId === game.id} key={game.id} onDetails={showDetails} onQuickPlay={(chosen) => startGame(chosen, defaultPlayers, 'quick')} />)}</div>
            </>}
          </section>
        </div>
      </main>
      <GameDetailsDialog game={selected} open={dialogOpen} launchState={launchSource === 'details' ? launchState : 'idle'} onOpenChange={setDialogOpen} onStart={startGame} />
    </>
  )
}
