/**
 * 紙本數獨輔助邏輯：候選數字計算、錯誤檢查、技巧提示與進度評估。
 *
 * 提示設計原則：只指出「哪個區域/格子可以用什麼技巧」，不直接告知答案數字，
 * 讓玩家自己動腦完成最後一步。
 */

export type Grid = number[][]
export type CellPos = [number, number]

export interface Hint {
  technique: string
  technique_name: string
  message: string
  cells: CellPos[]
  region?: string
  difficulty: string
}

export interface Progress {
  filled: number
  total: number
  percent: number
  difficulty: string
}

export interface AnalyzeResult {
  candidates: Record<string, number[]>
  conflicts: CellPos[]
  hint: Hint | null
  progress: Progress
}

const ALL_DIGITS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])

export function isValidGrid(grid: unknown): grid is Grid {
  if (!Array.isArray(grid) || grid.length !== 9) {
    return false
  }
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== 9) {
      return false
    }
    for (const v of row) {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 9) {
        return false
      }
    }
  }
  return true
}

function boxCells(r: number, c: number): CellPos[] {
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  const cells: CellPos[] = []
  for (let i = br; i < br + 3; i++) {
    for (let j = bc; j < bc + 3; j++) {
      cells.push([i, j])
    }
  }
  return cells
}

/** 回傳每格的候選數字集合（已填的格子為空集合）。 */
export function getCandidates(grid: Grid): Set<number>[][] {
  const candidates: Set<number>[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>()),
  )

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) {
        continue
      }
      const used = new Set<number>()
      for (let j = 0; j < 9; j++) {
        used.add(grid[r][j])
      }
      for (let i = 0; i < 9; i++) {
        used.add(grid[i][c])
      }
      for (const [i, j] of boxCells(r, c)) {
        used.add(grid[i][j])
      }
      candidates[r][c] = new Set([...ALL_DIGITS].filter((d) => !used.has(d)))
    }
  }

  return candidates
}

/** 回傳違反數獨規則（同列/欄/區塊重複）的格子座標清單。 */
export function findConflicts(grid: Grid): CellPos[] {
  const conflicts = new Set<string>()

  const checkGroup = (cells: CellPos[]) => {
    const seen = new Map<number, CellPos>()
    for (const [r, c] of cells) {
      const v = grid[r][c]
      if (v === 0) {
        continue
      }
      if (seen.has(v)) {
        conflicts.add(`${r},${c}`)
        const [sr, sc] = seen.get(v)!
        conflicts.add(`${sr},${sc}`)
      } else {
        seen.set(v, [r, c])
      }
    }
  }

  for (let r = 0; r < 9; r++) {
    checkGroup(Array.from({ length: 9 }, (_, c): CellPos => [r, c]))
  }
  for (let c = 0; c < 9; c++) {
    checkGroup(Array.from({ length: 9 }, (_, r): CellPos => [r, c]))
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: CellPos[] = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.push([br * 3 + i, bc * 3 + j])
        }
      }
      checkGroup(cells)
    }
  }

  return [...conflicts]
    .map((key) => key.split(',').map(Number) as CellPos)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
}

function nakedSingleHint(grid: Grid, candidates: Set<number>[][]): Hint | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 && candidates[r][c].size === 1) {
        return {
          technique: 'naked_single',
          technique_name: '唯一候選數 (Naked Single)',
          message: `看看第 ${r + 1} 列、第 ${c + 1} 欄這一格——把其他規則排除後，它只剩下一個可能的數字了。`,
          cells: [[r, c]],
          difficulty: '簡單',
        }
      }
    }
  }
  return null
}

function hiddenSingleHint(grid: Grid, candidates: Set<number>[][]): Hint | null {
  const groups: [string, CellPos[]][] = []

  for (let r = 0; r < 9; r++) {
    groups.push([`第 ${r + 1} 列`, Array.from({ length: 9 }, (_, c): CellPos => [r, c])])
  }
  for (let c = 0; c < 9; c++) {
    groups.push([`第 ${c + 1} 欄`, Array.from({ length: 9 }, (_, r): CellPos => [r, c])])
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: CellPos[] = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.push([br * 3 + i, bc * 3 + j])
        }
      }
      groups.push([
        `第 ${br + 1}-${bc + 1} 宮 (左上數第 ${br + 1} 排、第 ${bc + 1} 列的 3x3 區塊)`,
        cells,
      ])
    }
  }

  for (const [label, cells] of groups) {
    const emptyCells = cells.filter(([r, c]) => grid[r][c] === 0)
    for (let digit = 1; digit <= 9; digit++) {
      if (cells.some(([r, c]) => grid[r][c] === digit)) {
        continue
      }
      const holders = emptyCells.filter(([r, c]) => candidates[r][c].has(digit))
      if (holders.length === 1) {
        const [hr, hc] = holders[0]
        return {
          technique: 'hidden_single',
          technique_name: '隱性唯一數 (Hidden Single)',
          message: `${label}裡，有一個數字其實只能填在其中一格——比較一下每格的候選數字找出它吧。`,
          cells: [[hr, hc]],
          region: label,
          difficulty: '中等',
        }
      }
    }
  }

  return null
}

function pointingPairHint(grid: Grid, candidates: Set<number>[][]): Hint | null {
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: CellPos[] = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.push([br * 3 + i, bc * 3 + j])
        }
      }
      const boxCellSet = new Set(cells.map(([r, c]) => `${r},${c}`))
      const boxLabel = `第 ${br + 1}-${bc + 1} 宮 (左上數第 ${br + 1} 排、第 ${bc + 1} 列的 3x3 區塊)`

      for (let digit = 1; digit <= 9; digit++) {
        if (cells.some(([r, c]) => grid[r][c] === digit)) {
          continue
        }
        const holders = cells.filter(([r, c]) => grid[r][c] === 0 && candidates[r][c].has(digit))
        if (holders.length < 2) {
          continue
        }
        const rows = new Set(holders.map(([r]) => r))
        const cols = new Set(holders.map(([, c]) => c))

        if (rows.size === 1) {
          const r = [...rows][0]
          const others: CellPos[] = []
          for (let c = 0; c < 9; c++) {
            if (!boxCellSet.has(`${r},${c}`) && grid[r][c] === 0 && candidates[r][c].has(digit)) {
              others.push([r, c])
            }
          }
          if (others.length > 0) {
            return {
              technique: 'pointing_pair',
              technique_name: '區塊定位 (Pointing Pair)',
              message: `${boxLabel}內，有個數字的候選位置全部集中在第 ${r + 1} 列——這代表同一列其他區塊的這個位置可以排除這個數字。`,
              cells: holders,
              region: boxLabel,
              difficulty: '困難',
            }
          }
        } else if (cols.size === 1) {
          const c = [...cols][0]
          const others: CellPos[] = []
          for (let r = 0; r < 9; r++) {
            if (!boxCellSet.has(`${r},${c}`) && grid[r][c] === 0 && candidates[r][c].has(digit)) {
              others.push([r, c])
            }
          }
          if (others.length > 0) {
            return {
              technique: 'pointing_pair',
              technique_name: '區塊定位 (Pointing Pair)',
              message: `${boxLabel}內，有個數字的候選位置全部集中在第 ${c + 1} 欄——這代表同一欄其他區塊的這個位置可以排除這個數字。`,
              cells: holders,
              region: boxLabel,
              difficulty: '困難',
            }
          }
        }
      }
    }
  }

  return null
}

/** 依「簡單→困難」順序尋找下一步可用的技巧提示。 */
export function findHint(grid: Grid, candidates?: Set<number>[][]): Hint | null {
  const c = candidates ?? getCandidates(grid)
  return nakedSingleHint(grid, c) ?? hiddenSingleHint(grid, c) ?? pointingPairHint(grid, c)
}

export function analyze(grid: Grid): AnalyzeResult {
  const candidates = getCandidates(grid)
  const conflicts = findConflicts(grid)
  const filled = grid.reduce((sum, row) => sum + row.filter((v) => v !== 0).length, 0)

  let hint: Hint | null = null
  if (conflicts.length === 0 && filled < 81) {
    hint = findHint(grid, candidates)
  }

  let difficulty: string
  if (conflicts.length > 0) {
    difficulty = '盤面有衝突，請先修正標記的格子'
  } else if (filled === 81) {
    difficulty = '已完成！'
  } else if (hint) {
    difficulty = hint.difficulty
  } else {
    difficulty = '需要更進階的技巧（本工具尚未涵蓋）'
  }

  const candidatesOut: Record<string, number[]> = {}
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (candidates[r][c].size > 0) {
        candidatesOut[`${r},${c}`] = [...candidates[r][c]].sort((a, b) => a - b)
      }
    }
  }

  return {
    candidates: candidatesOut,
    conflicts,
    hint,
    progress: {
      filled,
      total: 81,
      percent: Math.round((filled / 81) * 1000) / 10,
      difficulty,
    },
  }
}
