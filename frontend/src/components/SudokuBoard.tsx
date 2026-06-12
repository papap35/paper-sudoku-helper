import type { ChangeEvent, KeyboardEvent, MutableRefObject } from 'react'
import type { Grid } from '../types'

interface SudokuBoardProps {
  grid: Grid
  candidates: Record<string, number[]>
  conflicts: Set<string>
  hintCells: Set<string>
  showCandidates: boolean
  inputRefs: MutableRefObject<(HTMLInputElement | null)[][]>
  onCellChange: (r: number, c: number, value: number) => void
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SudokuBoard({
  grid,
  candidates,
  conflicts,
  hintCells,
  showCandidates,
  inputRefs,
  onCellChange,
}: SudokuBoardProps) {
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

  return (
    <div className={`board${showCandidates ? ' show-candidates' : ''}`}>
      {grid.map((row, r) =>
        row.map((value, c) => {
          const key = `${r},${c}`
          const cellCandidates = candidates[key] || []
          const classNames = ['cell']
          if (c % 3 === 2 && c !== 8) classNames.push('border-right-3')
          if (r % 3 === 2 && r !== 8) classNames.push('border-bottom-3')
          if (value !== 0) classNames.push('has-value')
          if (conflicts.has(key)) classNames.push('conflict')
          if (hintCells.has(key)) classNames.push('hint')

          return (
            <div className={classNames.join(' ')} key={key}>
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
                  {DIGITS.map((n) => (
                    <span key={n} className={cellCandidates.includes(n) ? 'active' : ''}>
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        }),
      )}
    </div>
  )
}
