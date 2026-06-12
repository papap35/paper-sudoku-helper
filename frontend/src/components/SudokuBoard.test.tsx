import { fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => {
    vi.useRealTimers()
  })

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
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={vi.fn()}
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
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={onCellChange}
        onLongPressCell={vi.fn()}
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
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={onCellChange}
        onLongPressCell={vi.fn()}
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
        userCandidates={{}}
        inputRefs={refs}
        onCellChange={vi.fn()}
        onLongPressCell={vi.fn()}
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
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={vi.fn()}
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
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={vi.fn()}
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
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={vi.fn()}
      />,
    )

    const firstCell = container.querySelectorAll('.cell')[0]
    expect(firstCell.querySelector('.candidates')).toBeNull()
  })

  it('triggers onLongPressCell after holding an empty cell', () => {
    vi.useFakeTimers()
    const onLongPressCell = vi.fn()
    const grid = emptyGrid()

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={onLongPressCell}
      />,
    )

    const cell = container.querySelectorAll('.cell')[0]
    fireEvent.pointerDown(cell)
    vi.advanceTimersByTime(500)

    expect(onLongPressCell).toHaveBeenCalledWith(0, 0)
  })

  it('does not trigger onLongPressCell when the pointer is released early', () => {
    vi.useFakeTimers()
    const onLongPressCell = vi.fn()
    const grid = emptyGrid()

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={onLongPressCell}
      />,
    )

    const cell = container.querySelectorAll('.cell')[0]
    fireEvent.pointerDown(cell)
    vi.advanceTimersByTime(200)
    fireEvent.pointerUp(cell)
    vi.advanceTimersByTime(500)

    expect(onLongPressCell).not.toHaveBeenCalled()
  })

  it('does not trigger onLongPressCell on a filled cell', () => {
    vi.useFakeTimers()
    const onLongPressCell = vi.fn()
    const grid = emptyGrid()
    grid[0][0] = 5

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        userCandidates={{}}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={onLongPressCell}
      />,
    )

    const cell = container.querySelectorAll('.cell')[0]
    fireEvent.pointerDown(cell)
    vi.advanceTimersByTime(500)

    expect(onLongPressCell).not.toHaveBeenCalled()
  })

  it('shows user-marked candidates and flags ones that are no longer possible', () => {
    const grid = emptyGrid()
    grid[0][1] = 4

    const { container } = render(
      <SudokuBoard
        grid={grid}
        candidates={{}}
        conflicts={new Set()}
        hintCells={new Set()}
        showCandidates={false}
        userCandidates={{ '0,0': new Set([2, 4]) }}
        inputRefs={createRefs()}
        onCellChange={vi.fn()}
        onLongPressCell={vi.fn()}
      />,
    )

    const cells = container.querySelectorAll('.cell')
    expect(cells[0]).toHaveClass('show-user-candidates')
    expect(cells[1]).not.toHaveClass('show-user-candidates')

    const spans = cells[0].querySelectorAll('.candidates span')
    expect(spans[1]).toHaveClass('user') // digit 2, still possible
    expect(spans[1]).not.toHaveClass('invalid')
    expect(spans[3]).toHaveClass('user') // digit 4, blocked by (0,1)
    expect(spans[3]).toHaveClass('invalid')
  })
})
