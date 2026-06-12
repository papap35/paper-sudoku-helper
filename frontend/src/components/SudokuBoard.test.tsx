import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MutableRefObject } from 'react'
import SudokuBoard from './SudokuBoard'
import { emptyGrid } from '../types'

function createRefs(): MutableRefObject<(HTMLInputElement | null)[][]> {
  return { current: Array.from({ length: 9 }, () => Array(9).fill(null)) }
}

function getCellInput(container: HTMLElement, r: number, c: number): HTMLInputElement {
  const inputs = container.querySelectorAll<HTMLInputElement>('.cell-input')
  return inputs[r * 9 + c]
}

describe('SudokuBoard', () => {
  it('renders 81 cell inputs with the grid values', () => {
    const grid = emptyGrid()
    grid[0][0] = 5

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
      />,
    )

    const inputs = container.querySelectorAll<HTMLInputElement>('.cell-input')
    expect(inputs).toHaveLength(81)
    expect(inputs[0].value).toBe('5')
    expect(inputs[1].value).toBe('')
  })

  it('strips non-digit characters and reports the parsed value', async () => {
    const user = userEvent.setup()
    const onCellChange = vi.fn()
    const grid = emptyGrid()

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        inputRefs={createRefs()}
        onCellChange={onCellChange}
      />,
    )

    const input = getCellInput(container, 0, 0)

    await user.type(input, '7')
    expect(onCellChange).toHaveBeenLastCalledWith(0, 0, 7)

    await user.type(input, 'a')
    expect(onCellChange).toHaveBeenLastCalledWith(0, 0, 0)
  })

  it('reports 0 when the input is cleared', async () => {
    const user = userEvent.setup()
    const onCellChange = vi.fn()
    const grid = emptyGrid()
    grid[0][0] = 5

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        inputRefs={createRefs()}
        onCellChange={onCellChange}
      />,
    )

    const input = getCellInput(container, 0, 0)
    await user.clear(input)

    expect(onCellChange).toHaveBeenLastCalledWith(0, 0, 0)
  })

  it('moves focus with arrow keys', async () => {
    const user = userEvent.setup()
    const refs = createRefs()
    const grid = emptyGrid()

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        inputRefs={refs}
        onCellChange={vi.fn()}
      />,
    )

    const first = getCellInput(container, 0, 0)
    first.focus()
    await user.keyboard('{ArrowRight}')
    expect(refs.current[0][1]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(refs.current[1][1]).toHaveFocus()
  })

  it('applies conflict and hint classes to the matching cells', () => {
    const grid = emptyGrid()

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set(['0,0'])}
        hintCells={new Set(['1,1'])}
        showCandidates={false}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
      />,
    )

    const cells = container.querySelectorAll('.cell')
    expect(cells[0]).toHaveClass('conflict')
    expect(cells[1 * 9 + 1]).toHaveClass('hint')
  })

  it('shows candidate digits as active when showCandidates is enabled', () => {
    const grid = emptyGrid()

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{ '0,0': [1, 2, 3] }}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={true}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
      />,
    )

    expect(container.querySelector('.board')).toHaveClass('show-candidates')

    const firstCellCandidates = container.querySelector('.cell .candidates')!
    const spans = firstCellCandidates.querySelectorAll('span')
    expect(spans[0]).toHaveClass('active')
    expect(spans[1]).toHaveClass('active')
    expect(spans[2]).toHaveClass('active')
    expect(spans[3]).not.toHaveClass('active')
  })

  it('does not render candidates for filled cells', () => {
    const grid = emptyGrid()
    grid[0][0] = 5

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={true}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
      />,
    )

    const firstCell = container.querySelectorAll('.cell')[0]
    expect(firstCell.querySelector('.candidates')).toBeNull()
  })
})
