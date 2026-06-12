import { useRef } from 'react'
import type { ChangeEvent, KeyboardEvent, MutableRefObject } from 'react'
import type { Grid } from '../types'
import { isDigitPossible } from '../sudoku'

interface SudokuBoardProps {
  grid: Grid
  candidates: Record<string, number[]>
  conflicts: Set<string>
  hintCells: Set<string>
  showCandidates: boolean
  userCandidates: Record<string, Set<number>>
  inputRefs: MutableRefObject<(HTMLInputElement | null)[][]>
  onCellChange: (r: number, c: number, value: number) => void
  onLongPressCell: (r: number, c: number) => void
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const LONG_PRESS_MS = 500

export default function SudokuBoard({
  grid,
  candidates,
  conflicts,
  hintCells,
  showCandidates,
  userCandidates,
  inputRefs,
  onCellChange,
  onLongPressCell,
}: SudokuBoardProps) {
  const longPressTimer = useRef<number | null>(null)

  function handleInput(r: number, c: number, e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^1-9]/g, '')
    onCellChange(r, c, digits ? parseInt(digits, 10) : 0)
  }

  function handleKeyDown(r: number, c: number, e: KeyboardEvent<HTMLInputElement>) {
    let target: [number, number] | null = null
    if (e.key === 'ArrowRight') target = [r, Math.min(c + 1, 8)]
    else if (e.key === 'ArrowLeft') target = [r, Math.max(c - 1, 0)]
    else if (e.key === 'ArrowDown') target = [Math.min(r + 1, 8), c]
    else if (e.key === 'ArrowUp') target = [Math.max(r - 1, 0), c]

    if (target) {
      e.preventDefault()
      inputRefs.current[target[0]][target[1]]?.focus()
    }
  }

  function startLongPress(r: number, c: number) {
    clearLongPress()
    longPressTimer.current = window.setTimeout(() => {
      inputRefs.current[r][c]?.blur()
      onLongPressCell(r, c)
    }, LONG_PRESS_MS)
  }

  function clearLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <div className={`board${showCandidates ? ' show-candidates' : ''}`}>
      {grid.map((row, r) =>
        row.map((value, c) => {
          const key = `${r},${c}`
          const cellCandidates = candidates[key] || []
          const userCands = userCandidates[key]
          const classNames = ['cell']
          if (c % 3 === 2 && c !== 8) classNames.push('border-right-3')
          if (r % 3 === 2 && r !== 8) classNames.push('border-bottom-3')
          if (value !== 0) classNames.push('has-value')
          if (conflicts.has(key)) classNames.push('conflict')
          if (hintCells.has(key)) classNames.push('hint')
          if (userCands && userCands.size > 0) classNames.push('show-user-candidates')

          return (
            <div
              className={classNames.join(' ')}
              key={key}
              onPointerDown={value === 0 ? () => startLongPress(r, c) : undefined}
              onPointerUp={clearLongPress}
              onPointerLeave={clearLongPress}
              onPointerCancel={clearLongPress}
              onContextMenu={(e) => e.preventDefault()}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="cell-input"
                value={value === 0 ? '' : String(value)}
                ref={(el) => {
                  inputRefs.current[r][c] = el
                }}
                onChange={(e) => handleInput(r, c, e)}
                onKeyDown={(e) => handleKeyDown(r, c, e)}
              />
              {value === 0 && (
                <div className="candidates">
                  {DIGITS.map((n) => {
                    const isUserMarked = userCands?.has(n) ?? false
                    const classNames = []
                    if (cellCandidates.includes(n)) classNames.push('active')
                    if (isUserMarked) {
                      classNames.push('user')
                      if (!isDigitPossible(grid, r, c, n)) classNames.push('invalid')
                    }
                    return (
                      <span key={n} className={classNames.join(' ')}>
                        {n}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }),
      )}
    </div>
  )
}
