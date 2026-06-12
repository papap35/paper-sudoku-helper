import { describe, expect, it } from 'vitest'
import { isDigitPossible } from './sudoku'
import { emptyGrid } from './types'

describe('isDigitPossible', () => {
  it('returns true for an empty grid', () => {
    const grid = emptyGrid()
    expect(isDigitPossible(grid, 0, 0, 5)).toBe(true)
  })

  it('returns false when the digit already exists in the same row', () => {
    const grid = emptyGrid()
    grid[0][5] = 7
    expect(isDigitPossible(grid, 0, 0, 7)).toBe(false)
  })

  it('returns false when the digit already exists in the same column', () => {
    const grid = emptyGrid()
    grid[5][0] = 3
    expect(isDigitPossible(grid, 0, 0, 3)).toBe(false)
  })

  it('returns false when the digit already exists in the same 3x3 box', () => {
    const grid = emptyGrid()
    grid[1][1] = 9
    expect(isDigitPossible(grid, 0, 0, 9)).toBe(false)
  })

  it('returns true when the digit only exists outside the row/column/box', () => {
    const grid = emptyGrid()
    grid[8][8] = 6
    expect(isDigitPossible(grid, 0, 0, 6)).toBe(true)
  })
})
