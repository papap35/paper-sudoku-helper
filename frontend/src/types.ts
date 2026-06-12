export type Grid = number[][]
export type Cell = [number, number]

export interface Hint {
  technique: string
  technique_name: string
  message: string
  cells: Cell[]
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
  conflicts: Cell[]
  hint: Hint | null
  progress: Progress
}

export function emptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}
