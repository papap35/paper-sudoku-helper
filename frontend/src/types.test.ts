import { describe, expect, it } from 'vitest'
import { emptyGrid } from './types'

describe('emptyGrid', () => {
  it('returns a 9x9 grid of zeros', () => {
    const grid = emptyGrid()
    expect(grid).toHaveLength(9)
    for (const row of grid) {
      expect(row).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    }
  })

  it('returns independent rows that can be mutated separately', () => {
    const grid = emptyGrid()
    grid[0][0] = 5
    expect(grid[1][0]).toBe(0)
  })
})
