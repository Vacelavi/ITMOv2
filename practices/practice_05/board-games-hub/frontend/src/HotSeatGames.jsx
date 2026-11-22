import { useMemo, useRef, useState } from 'react'
import { ArrowLeftIcon, RotateCcwIcon } from 'lucide-react'
import GameResultScreen from './GameResultScreen.jsx'
import { useGameResultSession } from './gameResult.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const defaultPlayerNames = Object.freeze({ w: 'Светлые', b: 'Тёмные' })
const playerName = (turn, players = defaultPlayerNames) => players?.[turn] || defaultPlayerNames[turn]
const other = (turn) => turn === 'w' ? 'b' : 'w'

function GameShell({ title, turn, players, message, onReset, onBack, children, actions }) {
  return (
    <main className="play-page min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-8" id="play-room">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Button className="w-fit" onClick={onBack} variant="ghost"><ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />К каталогу</Button>
          <div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Локальная партия</p><h1 className="font-heading text-3xl font-semibold sm:text-4xl">{title}</h1></div>
          <Badge className="justify-self-end" variant="outline">Два игрока</Badge>
        </header>
        <Separator />
        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
          <div className="flex min-w-0 flex-col items-center gap-4">
            <div className="flex w-full max-w-[min(76vh,760px)] items-center justify-between gap-3" aria-live="polite">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Текущий игрок</p><p className="font-heading text-2xl font-semibold">Ход: {playerName(turn, players)}</p></div>
              <span className={`turn-stone turn-stone--${turn === 'b' ? 'dark' : 'light'}`} aria-hidden="true" />
            </div>
            <p className="game-message w-full max-w-[min(76vh,760px)]" role="status">{message}</p>
            <div className="board-wrap w-full max-w-[min(76vh,760px)]">{children}</div>
          </div>
          <aside className="game-aside flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-8">
            {actions}
            <Separator />
            <Button variant="outline" onClick={onReset}><RotateCcwIcon data-icon="inline-start" aria-hidden="true" />Новая партия</Button>
            <p className="text-xs leading-relaxed text-muted-foreground">Передайте устройство сопернику после завершения своего хода.</p>
          </aside>
        </section>
      </div>
    </main>
  )
}

const chessIcons = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const initialChess = ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR'].map((row) => [...row])
const pieceColor = (piece) => piece === '.' ? null : piece === piece.toUpperCase() ? 'w' : 'b'

function legalChessMove(board, from, to) {
  const piece = board[from.r][from.c]
  const target = board[to.r][to.c]
  if (piece === '.' || pieceColor(piece) === pieceColor(target)) return false
  const dr = to.r - from.r
  const dc = to.c - from.c
  const absR = Math.abs(dr)
  const absC = Math.abs(dc)
  const type = piece.toLowerCase()
  if (type === 'p') {
    const direction = pieceColor(piece) === 'w' ? -1 : 1
    const start = pieceColor(piece) === 'w' ? 6 : 1
    if (dc === 0 && target === '.' && (dr === direction || (from.r === start && dr === direction * 2 && board[from.r + direction][from.c] === '.'))) return true
    return absC === 1 && dr === direction && target !== '.'
  }
  if (type === 'n') return (absR === 2 && absC === 1) || (absR === 1 && absC === 2)
  if (type === 'k') return Math.max(absR, absC) === 1
  if (type === 'r' && dr !== 0 && dc !== 0) return false
  if (type === 'b' && absR !== absC) return false
  if (type === 'q' && dr !== 0 && dc !== 0 && absR !== absC) return false
  const stepR = Math.sign(dr)
  const stepC = Math.sign(dc)
  let r = from.r + stepR
  let c = from.c + stepC
  while (r !== to.r || c !== to.c) {
    if (board[r][c] !== '.') return false
    r += stepR
    c += stepC
  }
  return true
}

function ChessGame({ players, onBack }) {
  const { result, completeMove, finish, resetSession } = useGameResultSession('chess')
  const [board, setBoard] = useState(() => initialChess.map((row) => [...row]))
  const [turn, setTurn] = useState('w')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState(() => `${playerName('w', players)} начинают. Выберите фигуру, затем клетку назначения.`)
  const [hintsEnabled, setHintsEnabled] = useState(true)
  // compute hint targets using the same legality checker used by handler
  const chessHints = useMemo(() => {
    if (!hintsEnabled || !selected) return new Map()
    const map = new Map()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (selected && legalChessMove(board, selected, { r, c }) && pieceColor(board[selected.r][selected.c]) !== pieceColor(board[r][c])) {
          const capture = board[r][c] !== '.' && pieceColor(board[r][c]) === other(pieceColor(board[selected.r][selected.c]))
          map.set(`${r}-${c}`, capture ? 'capture' : 'move')
        }
      }
    }
    return map
  }, [board, selected, hintsEnabled])
  const reset = () => { resetSession(); setBoard(initialChess.map((row) => [...row])); setTurn('w'); setSelected(null); setMessage(`Новая партия. Ход: ${playerName('w', players)}.`) }
  const click = (r, c) => {
    if (result) return
    const piece = board[r][c]
    if (!selected) {
      if (pieceColor(piece) !== turn) return setMessage(`Сейчас ходит ${playerName(turn, players)}.`)
      setSelected({ r, c }); setMessage('Теперь выберите клетку назначения.'); return
    }
    if (pieceColor(piece) === turn) { setSelected({ r, c }); return }
    if (!legalChessMove(board, selected, { r, c })) return setMessage('Эта фигура не может так ходить.')
    const next = board.map((row) => [...row])
    const captured = next[r][c]
    next[r][c] = next[selected.r][selected.c]
    next[selected.r][selected.c] = '.'
    if (next[r][c] === 'P' && r === 0) next[r][c] = 'Q'
    if (next[r][c] === 'p' && r === 7) next[r][c] = 'q'
    setBoard(next); setSelected(null)
    const finalMoveCount = completeMove()
    if (captured.toLowerCase() === 'k') {
      finish({ outcome: 'win', winner: turn, reason: 'king_captured', moveCount: finalMoveCount })
      setMessage(`${playerName(turn, players)} победили! Король соперника взят.`)
      return
    }
    const nextTurn = other(turn); setTurn(nextTurn); setMessage(`Ход выполнен. Теперь ходит ${playerName(nextTurn, players)}.`)
  }
  if (result) return <GameResultScreen result={result} players={players} onRestart={reset} onBack={onBack} />
  return <GameShell title="Шахматы · доска 8×8" turn={turn} players={players} message={message} onReset={reset} onBack={onBack} actions={<><h3>Позиция</h3><p>Доступны ходы всех фигур, взятия и превращение пешки. Рокировка и шах не подсвечиваются.</p><Button variant="outline" aria-pressed={hintsEnabled} onClick={() => setHintsEnabled(v => !v)}>Подсказки: {hintsEnabled ? 'вкл.' : 'выкл.'}</Button></>}><div className="play-board chess-play">{board.flatMap((row, r) => row.map((piece, c) => {
    const hintKind = chessHints.get(`${r}-${c}`)
    const hintClass = hintKind === 'capture' ? 'hint-capture' : hintKind === 'move' ? 'hint' : ''
    const aria = `${r + 1}:${c + 1}` + (hintKind ? ' доступная цель' : '')
    return <button aria-label={aria} className={`${(r + c) % 2 ? 'dark' : 'light'} ${pieceColor(piece) === 'b' ? 'piece-black' : pieceColor(piece) === 'w' ? 'piece-white' : ''} ${selected?.r === r && selected?.c === c ? 'selected' : ''} ${hintClass}`} key={`${r}-${c}`} onClick={() => click(r, c)}>{chessIcons[piece]}</button>
  }))}</div></GameShell>
}

const initialCheckers = () => Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (r + c) % 2 === 0 ? null : r < 3 ? 'b' : r > 4 ? 'w' : null))
const checkColor = (piece) => piece?.toLowerCase()
function availableCaptures(board, turn, only = null) {
  const moves = []
  board.forEach((row, r) => row.forEach((piece, c) => {
    if (checkColor(piece) !== turn || (only && (only.r !== r || only.c !== c))) return
    const dirs = piece === piece.toUpperCase() ? [[1,1],[1,-1],[-1,1],[-1,-1]] : turn === 'w' ? [[-1,1],[-1,-1]] : [[1,1],[1,-1]]
    dirs.forEach(([dr, dc]) => { const mr = r + dr, mc = c + dc, tr = r + dr * 2, tc = c + dc * 2; if (board[tr]?.[tc] === null && board[mr]?.[mc] && checkColor(board[mr][mc]) === other(turn)) moves.push({ from:{r,c}, to:{r:tr,c:tc} }) })
  }))
  return moves
}

function CheckersGame({ players, onBack }) {
  const { result, completeMove, finish, resetSession } = useGameResultSession('checkers')
  const [board, setBoard] = useState(initialCheckers)
  const [turn, setTurn] = useState('w')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('Светлые начинают. Взятие обязательно.')
  const [hintsEnabled, setHintsEnabled] = useState(true)
  const [forced, setForced] = useState(null) // текущая шашка для продолжения цепочки
  const reset = () => { resetSession(); setBoard(initialCheckers()); setTurn('w'); setSelected(null); setForced(null); setMessage('Новая партия. Ход светлых.') }
  const click = (r, c) => {
    if (result) return
    const piece = board[r][c]
    if (!selected) { if (checkColor(piece) !== turn) return setMessage(`Выберите шашку: ходит ${playerName(turn, players)}.`); if (forced && (forced.r !== r || forced.c !== c)) return setMessage('Продолжите серию взятий текущей шашкой.'); setSelected({r,c}); return }
    if (checkColor(piece) === turn) { if (forced && (forced.r !== r || forced.c !== c)) return setMessage('Продолжите серию взятий текущей шашкой.'); setSelected({r,c}); return }
    if (piece !== null) return
    const moving = board[selected.r][selected.c]
    const dr = r - selected.r, dc = c - selected.c
    const captures = availableCaptures(board, turn)
    const isKing = moving === moving.toUpperCase()
    const forward = turn === 'w' ? -1 : 1
    const isCapture = Math.abs(dr) === 2 && Math.abs(dc) === 2 && checkColor(board[selected.r + dr / 2][selected.c + dc / 2]) === other(turn)
    const isStep = Math.abs(dc) === 1 && (dr === forward || (isKing && Math.abs(dr) === 1))
    if ((!isCapture && (!isStep || captures.length)) || (isCapture && !captures.some((move) => move.from.r === selected.r && move.from.c === selected.c && move.to.r === r && move.to.c === c))) return setMessage(captures.length ? 'Доступно обязательное взятие.' : 'Так ходить нельзя.')
    const next = board.map((row) => [...row]); next[r][c] = moving; next[selected.r][selected.c] = null
    if (isCapture) next[selected.r + dr / 2][selected.c + dc / 2] = null
    if (turn === 'w' && r === 0) next[r][c] = 'W'; if (turn === 'b' && r === 7) next[r][c] = 'B'
    setBoard(next)
    if (isCapture && availableCaptures(next, turn, {r,c}).length) { setSelected({r,c}); setForced({r,c}); setMessage('Продолжайте серию взятий этой шашкой.'); return }
    const finalMoveCount = completeMove()
    const nextTurn = other(turn); setSelected(null)
    setForced(null)
    if (!next.flat().some((item) => checkColor(item) === nextTurn)) {
      finish({ outcome: 'win', winner: turn, reason: 'no_pieces', moveCount: finalMoveCount })
      setMessage(`${playerName(turn, players)} победили — у соперника не осталось шашек.`)
    } else {
      setTurn(nextTurn)
      setMessage(`Теперь ходит ${playerName(nextTurn, players)}.`)
    }
  }
  // compute hint targets using the same generator logic as handler
  const checkersHints = useMemo(() => {
    if (!hintsEnabled) return new Map()
    const map = new Map()
    const caps = availableCaptures(board, turn, forced || null)
    if (caps.length) {
      // if a piece is selected (or forced), only show its capture moves
      const src = forced || selected
      caps.forEach(({from,to}) => {
        if (src && from.r === src.r && from.c === src.c) map.set(`${to.r}-${to.c}`, 'capture')
      })
      return map
    }
    // no captures: if a piece selected, show step moves
    if (!selected) return map
    const moving = board[selected.r][selected.c]
    if (!moving) return map
    const isKing = moving === moving.toUpperCase()
    const forward = turn === 'w' ? -1 : 1
    const dirs = isKing ? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[forward,1],[forward,-1]]
    dirs.forEach(([dr,dc]) => {
      const tr = selected.r + dr, tc = selected.c + dc
      if (board[tr]?.[tc] === null) map.set(`${tr}-${tc}`, 'move')
    })
    return map
  }, [board, turn, selected, hintsEnabled, forced])
  if (result) return <GameResultScreen result={result} players={players} onRestart={reset} onBack={onBack} />
  return <GameShell title="Шашки · доска 8×8" turn={turn} players={players} message={message} onReset={reset} onBack={onBack} actions={<><h3>На доске</h3><p>Взятие обязательно. Цепочка взятий продолжается той же шашкой, на последней линии появляется дамка.</p><Button variant="outline" aria-pressed={hintsEnabled} onClick={() => setHintsEnabled(v => !v)}>Подсказки: {hintsEnabled ? 'вкл.' : 'выкл.'}</Button></>}><div className="play-board checkers-play">{board.flatMap((row,r) => row.map((piece,c) => {
    const hintKind = checkersHints.get(`${r}-${c}`)
    const hintClass = hintKind === 'capture' ? 'hint-capture' : hintKind === 'move' ? 'hint' : ''
    const aria = (hintKind ? `Доступная цель ${r+1}:${c+1}` : undefined)
    return <button aria-label={aria} className={`${(r+c)%2?'dark':'light'} ${selected?.r===r&&selected?.c===c?'selected':''} ${hintClass}`} key={`${r}-${c}`} onClick={() => click(r,c)}>{piece && <i className={`${checkColor(piece)} ${piece === piece.toUpperCase() ? 'king' : ''}`} />}</button>
  }))}</div></GameShell>
}

const emptyGo = () => Array.from({length:9}, () => Array(9).fill(null))
const neighbors = (r,c) => [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([nr,nc]) => nr>=0&&nr<9&&nc>=0&&nc<9)
function groupAt(board,r,c) { const color=board[r][c], group=[], seen=new Set([`${r},${c}`]), stack=[[r,c]]; let liberties=0; while(stack.length){const [cr,cc]=stack.pop();group.push([cr,cc]);neighbors(cr,cc).forEach(([nr,nc])=>{if(board[nr][nc]===null) liberties++;else if(board[nr][nc]===color&&!seen.has(`${nr},${nc}`)){seen.add(`${nr},${nc}`);stack.push([nr,nc])}})} return {group,liberties} }
function scoreGo(board, captures) { let w=captures.w, b=captures.b; const seen=new Set(); board.forEach((row,r)=>row.forEach((cell,c)=>{if(cell==='w')w++;if(cell==='b')b++;if(cell!==null||seen.has(`${r},${c}`))return;const region=[],colors=new Set(),stack=[[r,c]];seen.add(`${r},${c}`);while(stack.length){const [cr,cc]=stack.pop();region.push([cr,cc]);neighbors(cr,cc).forEach(([nr,nc])=>{if(board[nr][nc]===null&&!seen.has(`${nr},${nc}`)){seen.add(`${nr},${nc}`);stack.push([nr,nc])}else if(board[nr][nc])colors.add(board[nr][nc])})}if(colors.size===1){if(colors.has('w'))w+=region.length;else b+=region.length}}));return {w,b} }

function GoGame({ players, onBack }) {
  const { result, completeMove, finish, resetSession } = useGameResultSession('go')
  const [board,setBoard]=useState(emptyGo); const [turn,setTurn]=useState('b'); const [message,setMessage]=useState(() => `${playerName('b', players)} начинают. Ставьте камень на свободное пересечение.`); const [captures,setCaptures]=useState({w:0,b:0}); const [passes,setPasses]=useState(0); const [previous,setPrevious]=useState(null)
  const [focusedPoint, setFocusedPoint] = useState(0)
  const pointRefs = useRef([])
  const passRef = useRef(null)
  const reset=()=>{resetSession();setBoard(emptyGo());setTurn('b');setMessage(`Новая партия. Ход: ${playerName('b', players)}.`);setCaptures({w:0,b:0});setPasses(0);setPrevious(null);setFocusedPoint(0)}
  const place=(r,c)=>{if(result)return;if(board[r][c])return setMessage('Эта точка уже занята. Выберите свободное пересечение.');const next=board.map(row=>[...row]);next[r][c]=turn;let removed=0;neighbors(r,c).forEach(([nr,nc])=>{if(next[nr][nc]===other(turn)){const group=groupAt(next,nr,nc);if(group.liberties===0){group.group.forEach(([gr,gc])=>next[gr][gc]=null);removed+=group.group.length}}});if(groupAt(next,r,c).liberties===0)return setMessage('Самоубийственный ход запрещён.');if(previous&&JSON.stringify(next)===JSON.stringify(previous))return setMessage('Правило ко: нельзя сразу повторить позицию.');completeMove();setPrevious(board);setBoard(next);setCaptures(value=>({...value,[turn]:value[turn]+removed}));setPasses(0);const nt=other(turn);setTurn(nt);setMessage(removed?`Захвачено камней: ${removed}. Ход соперника.`:`Теперь ходит ${playerName(nt, players)}.`);window.requestAnimationFrame?.(()=>pointRefs.current[r*9+c]?.focus())}
  const handlePointKeyDown = (event, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      place(Math.floor(index / 9), index % 9)
      return
    }
    const rowStart = Math.floor(index / 9) * 9
    const target = {
      ArrowLeft: Math.max(rowStart, index - 1),
      ArrowRight: Math.min(rowStart + 8, index + 1),
      ArrowUp: Math.max(0, index - 9),
      ArrowDown: Math.min(80, index + 9),
    }[event.key]
    if (target !== undefined) {
      event.preventDefault()
      setFocusedPoint(target)
      pointRefs.current[target]?.focus()
    }
  }
  const pass=()=>{if(result)return;const nextPasses=passes+1;const finalMoveCount=completeMove();if(nextPasses===2){const score=scoreGo(board,captures);const winner=score.w===score.b?null:score.w>score.b?'w':'b';finish({outcome:winner?'win':'draw',winner,reason:'double_pass',moveCount:finalMoveCount});setMessage(`Партия завершена. ${playerName('w', players)}: ${score.w}, ${playerName('b', players)}: ${score.b}.`);return}setPasses(nextPasses);setTurn(other(turn));setMessage(`${playerName(turn, players)} пасуют. Второй пас подряд завершит игру.`)}
  if (result) return <GameResultScreen result={result} players={players} onRestart={reset} onBack={onBack} />
  return <GameShell title="Го · доска 9×9" turn={turn} players={players} message={message} onReset={reset} onBack={onBack} actions={<><h3>Партия</h3><div className="score-row"><span>● {captures.b}</span><span>○ {captures.w}</span></div><p>Два последовательных паса завершают партию.</p><Button className="h-11" id="go-pass-action" ref={passRef} onClick={pass}>Пас</Button></>}><a className="skip-board-link" href="#go-pass-action" onClick={(event)=>{event.preventDefault();passRef.current?.focus()}}>Перейти к действиям партии</a><div className="go-board" role="grid" aria-label="Игровая доска Го, 9 на 9"><div className={`go-grid go-grid--${turn === 'b' ? 'dark' : 'light'}`}>{board.flatMap((row,r)=>row.map((stone,c)=>{const index=r*9+c;return <button className="go-point" ref={(element)=>{pointRefs.current[index]=element}} role="gridcell" tabIndex={focusedPoint===index?0:-1} key={`${r}-${c}`} onFocus={()=>setFocusedPoint(index)} onKeyDown={(event)=>handlePointKeyDown(event,index)} onClick={()=>place(r,c)} aria-label={`Пересечение ${r+1}:${c+1}${stone?', занято':' свободно'}`}>{stone&&<i className={`board-stone board-stone--${stone === 'b' ? 'dark' : 'light'}`}/>}</button>}))}</div></div></GameShell>
}

function initialBackgammon(){const points=Array.from({length:24},()=>[]);[[0,2],[11,5],[16,3],[18,5]].forEach(([p,n])=>points[p]=Array(n).fill('w'));[[23,2],[12,5],[7,3],[5,5]].forEach(([p,n])=>points[p]=Array(n).fill('b'));return points}
function canBearOff(points,turn,bar){if(bar[turn])return false;return points.every((stack,i)=>!stack.includes(turn)||(turn==='w'?i>=18:i<=5))}
function BackgammonGame({ players, onBack }){
  const { result, completeMove, finish, resetSession } = useGameResultSession('backgammon')
  const [points,setPoints]=useState(initialBackgammon);const [turn,setTurn]=useState('w');const [dice,setDice]=useState([]);const [selected,setSelected]=useState(null);const [bar,setBar]=useState({w:0,b:0});const [borne,setBorne]=useState({w:0,b:0});const [message,setMessage]=useState(() => `${playerName('w', players)} начинают: бросьте кости.`);
  const reset=()=>{resetSession();setPoints(initialBackgammon());setTurn('w');setDice([]);setSelected(null);setBar({w:0,b:0});setBorne({w:0,b:0});setMessage(`Новая партия. ${playerName('w', players)} бросают кости.`)}
  const roll=()=>{if(dice.length)return;const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);setDice(a===b?[a,a,a,a]:[a,b]);setMessage(`Выпало ${a} и ${b}. Выберите шашку, затем пункт.`)}
  const targetFor=(from,die)=>from+(turn==='w'?die:-die)
  const isOpen=(target)=>target<0||target>23||points[target].length<2||points[target][0]===turn
  const sourceClick=(index)=>{if(!dice.length)return setMessage('Сначала бросьте кости.');if(bar[turn]>0)return setMessage('Сначала верните шашку с бара.');if(points[index][0]!==turn)return setMessage('Выберите свою шашку.');setSelected(index);setMessage('Выберите пункт назначения.')}
  const moveTo=(target)=>{if(selected===null)return sourceClick(target);const dieIndex=dice.findIndex(d=>targetFor(selected,d)===target);if(dieIndex<0||!isOpen(target))return setMessage('Этот ход не соответствует костям или пункт закрыт.');makeMove(selected,target,dieIndex)}
  const makeMove=(from,target,dieIndex,fromBar=false)=>{const next=points.map(stack=>[...stack]);if(!fromBar)next[from].pop();const nextBar={...bar};if(fromBar)nextBar[turn]--;if(target>=0&&target<24&&next[target].length===1&&next[target][0]!==turn){nextBar[other(turn)]++;next[target]=[]}const nextBorne={...borne};if(target<0||target>23)nextBorne[turn]++;else next[target].push(turn);const remaining=dice.filter((_,i)=>i!==dieIndex);setPoints(next);setBar(nextBar);setBorne(nextBorne);setSelected(null);setDice(remaining);if(nextBorne[turn]===15){const finalMoveCount=completeMove();finish({outcome:'win',winner:turn,reason:'bear_off',moveCount:finalMoveCount});setMessage(`${playerName(turn, players)} победили! Все шашки сняты.`);return}if(!remaining.length){completeMove();const nt=other(turn);setTurn(nt);setMessage(`Ход завершён. ${playerName(nt, players)} бросают кости.`)}else setMessage(`Осталось ходов по костям: ${remaining.join(', ')}.`)}
  const enterFromBar=()=>{if(!dice.length)return setMessage('Сначала бросьте кости.');if(!bar[turn])return setMessage('На баре нет ваших шашек.');const dieIndex=dice.findIndex(d=>isOpen(turn==='w'?d-1:24-d));if(dieIndex<0)return setMessage('Нет доступного входа с бара.');const target=turn==='w'?dice[dieIndex]-1:24-dice[dieIndex];makeMove(null,target,dieIndex,true)}
  const bearOff=()=>{if(selected===null)return setMessage('Сначала выберите шашку.');if(!canBearOff(points,turn,bar))return setMessage('Снимать шашки можно, только когда все они в доме.');const dieIndex=dice.findIndex(d=>targetFor(selected,d)<0||targetFor(selected,d)>23);if(dieIndex<0)return setMessage('Этой костью шашку снять нельзя.');makeMove(selected,targetFor(selected,dice[dieIndex]),dieIndex)}
  const finishTurn=()=>{if(!dice.length)return;completeMove();const nt=other(turn);setDice([]);setSelected(null);setTurn(nt);setMessage(`Ход завершён досрочно. ${playerName(nt, players)} бросают кости.`)}
  const stacks=useMemo(()=>points.map((stack,index)=>({stack,index})),[points])
  const renderPoint=({stack,index},bottom=false)=><button key={index} className={`play-backgammon-point ${bottom?'play-backgammon-point--bottom':''} ${selected===index?'is-selected':''}`} aria-label={`Пункт ${index+1}: ${stack.length} шашек`} onClick={()=>selected===null?sourceClick(index):moveTo(index)}><span className="play-backgammon-triangle"/><span className={`play-backgammon-stack ${stack[0]?`play-backgammon-stack--${stack[0]==='w'?'white':'black'}`:''}`}>{stack.slice(0,5).map((piece,i)=><span key={i}/>)}{stack.length>5&&<strong>+{stack.length-5}</strong>}</span></button>
  if (result) return <GameResultScreen result={result} players={players} onRestart={reset} onBack={onBack} />
  return <GameShell title="Нарды · длинная доска" turn={turn} players={players} message={message} onReset={reset} onBack={onBack} actions={<><h3>Кости</h3><div className="dice-row">{dice.length?dice.map((die,i)=><b key={i}>{die}</b>):<span>Ожидают броска</span>}</div><Button onClick={roll} disabled={dice.length>0}>Бросить кости</Button><Button variant="outline" onClick={enterFromBar}>Войти с бара ({bar[turn]})</Button><Button variant="outline" onClick={bearOff}>Снять выбранную ({borne[turn]}/15)</Button><Button variant="ghost" onClick={finishTurn} disabled={!dice.length}>Нет доступных ходов</Button><p>Бросьте кости, выберите свою шашку и пункт назначения.</p></>}><div className="play-backgammon-board"><div className="play-backgammon-row">{stacks.slice(0,12).map((point)=>renderPoint(point))}</div><span className="play-backgammon-bar" aria-hidden="true">{bar.w>0&&<span className="bar-count bar-count--white">{bar.w}</span>}{bar.b>0&&<span className="bar-count bar-count--black">{bar.b}</span>}</span><div className="play-backgammon-row">{stacks.slice(12).map((point)=>renderPoint(point,true))}</div></div></GameShell>
}

export default function HotSeatGame({ gameId, players = defaultPlayerNames, onBack = () => {} }) {
  if (gameId === 'chess') return <ChessGame players={players} onBack={onBack} />
  if (gameId === 'checkers') return <CheckersGame players={players} onBack={onBack} />
  if (gameId === 'go') return <GoGame players={players} onBack={onBack} />
  return <BackgammonGame players={players} onBack={onBack} />
}
