import type { Grid } from './types'

/** 檢查在目前盤面下，(r, c) 這格是否還能填入 digit（同列、欄、宮內尚未出現過）。 */
export function isDigitPossible(grid: Grid, r: number, c: number, digit: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === digit || grid[i][c] === digit) {
      return false
    }
  }

  const boxRow = Math.floor(r / 3) * 3
  const boxCol = Math.floor(c / 3) * 3
  for (let i = boxRow; i < boxRow + 3; i++) {
    for (let j = boxCol; j < boxCol + 3; j++) {
      if (grid[i][j] === digit) {
        return false
      }
    }
  }

  return true
}
