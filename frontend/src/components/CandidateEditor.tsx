import type { Grid } from '../types'
import { isDigitPossible } from '../sudoku'

interface CandidateEditorProps {
  grid: Grid
  cell: [number, number]
  selected: Set<number>
  onToggle: (digit: number) => void
  onClose: () => void
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function CandidateEditor({ grid, cell, selected, onToggle, onClose }: CandidateEditorProps) {
  const [r, c] = cell
  const hasInvalid = DIGITS.some((digit) => selected.has(digit) && !isDigitPossible(grid, r, c, digit))

  return (
    <div className="candidate-editor-overlay" onClick={onClose}>
      <div className="candidate-editor" onClick={(e) => e.stopPropagation()}>
        <p className="candidate-editor-title">{`第 ${r + 1} 列第 ${c + 1} 欄　手動候選數字`}</p>
        <div className="candidate-editor-grid">
          {DIGITS.map((digit) => {
            const isSelected = selected.has(digit)
            const isInvalid = isSelected && !isDigitPossible(grid, r, c, digit)
            const classNames = ['candidate-editor-digit']
            if (isSelected) classNames.push('selected')
            if (isInvalid) classNames.push('invalid')
            return (
              <button
                key={digit}
                type="button"
                className={classNames.join(' ')}
                onClick={() => onToggle(digit)}
              >
                {digit}
              </button>
            )
          })}
        </div>
        {hasInvalid && (
          <p className="candidate-editor-warning">
            ⚠️ 紅色的數字目前不可能填在這格（同一列、欄或宮已經有這個數字了）。
          </p>
        )}
        <button type="button" className="candidate-editor-close" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  )
}
