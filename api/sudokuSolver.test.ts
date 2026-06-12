import { describe, expect, it } from 'vitest'
import { analyze, findConflicts, findHint, getCandidates, isValidGrid } from './sudokuSolver'

const EMPTY_GRID = Array.from({ length: 9 }, () => Array(9).fill(0))

const SOLVED_GRID = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

// 唯一候選數：第 5 列、第 5 欄只剩下 5 可以填
const NAKED_SINGLE_GRID = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
]

// 隱性唯一數：第 1 列裡只有 (0,5) 能填某個數字
const HIDDEN_SINGLE_GRID = [
  [0, 3, 0, 4, 0, 0, 1, 0, 7],
  [4, 5, 6, 7, 2, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 5, 0, 4],
  [0, 0, 3, 6, 5, 0, 0, 1, 0],
  [0, 4, 0, 2, 0, 7, 0, 3, 0],
  [0, 0, 0, 0, 3, 9, 0, 0, 0],
  [0, 8, 0, 0, 4, 6, 0, 0, 0],
  [0, 0, 0, 3, 9, 0, 6, 0, 0],
  [0, 6, 4, 0, 7, 0, 0, 0, 0],
]

// 區塊定位：第 3-2 宮內某數字的候選位置全部集中在第 9 列
const POINTING_PAIR_GRID = [
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 3, 0, 4, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 4, 3],
  [4, 0, 2, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 5, 6, 7, 0, 0, 2, 4],
  [2, 0, 3, 0, 9, 1, 6, 7, 0],
  [0, 0, 0, 8, 6, 7, 0, 0, 0],
  [0, 0, 7, 2, 0, 0, 0, 1, 0],
]

describe('isValidGrid', () => {
  it('accepts a 9x9 grid of 0-9', () => {
    expect(isValidGrid(EMPTY_GRID)).toBe(true)
    expect(isValidGrid(SOLVED_GRID)).toBe(true)
  })

  it('rejects grids with the wrong shape', () => {
    expect(isValidGrid([])).toBe(false)
    expect(isValidGrid(EMPTY_GRID.slice(0, 8))).toBe(false)
    expect(isValidGrid(EMPTY_GRID.map((row) => row.slice(0, 8)))).toBe(false)
  })

  it('rejects grids with out-of-range or non-integer values', () => {
    const tooBig = EMPTY_GRID.map((row) => [...row])
    tooBig[0][0] = 10
    expect(isValidGrid(tooBig)).toBe(false)

    const negative = EMPTY_GRID.map((row) => [...row])
    negative[0][0] = -1
    expect(isValidGrid(negative)).toBe(false)

    const nonInteger = EMPTY_GRID.map((row): unknown[] => [...row])
    nonInteger[0][0] = 1.5
    expect(isValidGrid(nonInteger)).toBe(false)
  })

  it('rejects non-array input', () => {
    expect(isValidGrid(null)).toBe(false)
    expect(isValidGrid('not a grid')).toBe(false)
    expect(isValidGrid({})).toBe(false)
  })
})

describe('getCandidates', () => {
  it('returns no candidates for filled cells', () => {
    const candidates = getCandidates(SOLVED_GRID)
    for (const row of candidates) {
      for (const cell of row) {
        expect(cell.size).toBe(0)
      }
    }
  })

  it('returns all digits for every cell of an empty grid', () => {
    const candidates = getCandidates(EMPTY_GRID)
    for (const row of candidates) {
      for (const cell of row) {
        expect([...cell].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
      }
    }
  })

  it('excludes digits already used in the row, column and box', () => {
    const candidates = getCandidates(NAKED_SINGLE_GRID)
    expect([...candidates[0][2]].sort()).toEqual([1, 2, 4])
    expect([...candidates[4][4]].sort()).toEqual([5])
  })
})

describe('findConflicts', () => {
  it('returns an empty list for a valid grid', () => {
    expect(findConflicts(EMPTY_GRID)).toEqual([])
    expect(findConflicts(SOLVED_GRID)).toEqual([])
    expect(findConflicts(NAKED_SINGLE_GRID)).toEqual([])
  })

  it('detects duplicate values in the same row', () => {
    const grid = EMPTY_GRID.map((row) => [...row])
    grid[0][0] = 5
    grid[0][1] = 5
    expect(findConflicts(grid)).toEqual([[0, 0], [0, 1]])
  })

  it('detects duplicate values in the same column', () => {
    const grid = EMPTY_GRID.map((row) => [...row])
    grid[0][0] = 7
    grid[3][0] = 7
    expect(findConflicts(grid)).toEqual([[0, 0], [3, 0]])
  })

  it('detects duplicate values in the same box', () => {
    const grid = EMPTY_GRID.map((row) => [...row])
    grid[0][0] = 9
    grid[1][1] = 9
    expect(findConflicts(grid)).toEqual([[0, 0], [1, 1]])
  })
})

describe('findHint', () => {
  it('finds a naked single before anything else', () => {
    const hint = findHint(NAKED_SINGLE_GRID)
    expect(hint).toEqual({
      technique: 'naked_single',
      technique_name: '唯一候選數 (Naked Single)',
      message: '看看第 5 列、第 5 欄這一格——把其他規則排除後，它只剩下一個可能的數字了。',
      cells: [[4, 4]],
      difficulty: '簡單',
    })
  })

  it('finds a hidden single when there is no naked single', () => {
    const hint = findHint(HIDDEN_SINGLE_GRID)
    expect(hint).toEqual({
      technique: 'hidden_single',
      technique_name: '隱性唯一數 (Hidden Single)',
      message: '第 1 列裡，有一個數字其實只能填在其中一格——比較一下每格的候選數字找出它吧。',
      cells: [[0, 5]],
      region: '第 1 列',
      difficulty: '中等',
    })
  })

  it('finds a pointing pair when no simpler technique applies', () => {
    const hint = findHint(POINTING_PAIR_GRID)
    expect(hint).toEqual({
      technique: 'pointing_pair',
      technique_name: '區塊定位 (Pointing Pair)',
      message:
        '第 3-2 宮 (左上數第 3 排、第 2 列的 3x3 區塊)內，有個數字的候選位置全部集中在第 9 列——這代表同一列其他區塊的這個位置可以排除這個數字。',
      cells: [[8, 4], [8, 5]],
      region: '第 3-2 宮 (左上數第 3 排、第 2 列的 3x3 區塊)',
      difficulty: '困難',
    })
  })

  it('returns null when no covered technique applies', () => {
    expect(findHint(EMPTY_GRID)).toBeNull()
  })
})

describe('analyze', () => {
  it('reports conflicts and skips hints when the grid is invalid', () => {
    const grid = EMPTY_GRID.map((row) => [...row])
    grid[0][0] = 5
    grid[0][1] = 5

    const result = analyze(grid)
    expect(result.conflicts).toEqual([[0, 0], [0, 1]])
    expect(result.hint).toBeNull()
    expect(result.progress.difficulty).toBe('盤面有衝突，請先修正標記的格子')
  })

  it('reports completion for a fully solved grid', () => {
    const result = analyze(SOLVED_GRID)
    expect(result.conflicts).toEqual([])
    expect(result.hint).toBeNull()
    expect(result.candidates).toEqual({})
    expect(result.progress).toEqual({
      filled: 81,
      total: 81,
      percent: 100,
      difficulty: '已完成！',
    })
  })

  it('reports progress and a hint-based difficulty for a partial grid', () => {
    const result = analyze(NAKED_SINGLE_GRID)
    expect(result.progress.filled).toBe(30)
    expect(result.progress.percent).toBeCloseTo(37, 0)
    expect(result.hint?.technique).toBe('naked_single')
    expect(result.progress.difficulty).toBe('簡單')
    expect(result.candidates['0,2']).toEqual([1, 2, 4])
  })

  it('reports the fallback difficulty when no hint technique applies', () => {
    const result = analyze(EMPTY_GRID)
    expect(result.conflicts).toEqual([])
    expect(result.hint).toBeNull()
    expect(result.progress.difficulty).toBe('需要更進階的技巧（本工具尚未涵蓋）')
    expect(Object.keys(result.candidates)).toHaveLength(81)
  })
})
