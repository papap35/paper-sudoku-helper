import type { AnalyzeResult, Grid } from './types'

export class ApiError extends Error {}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data?.error || fallback
  } catch {
    return fallback
  }
}

export async function analyzeGrid(grid: Grid): Promise<AnalyzeResult> {
  const res = await fetch('/api/sudoku/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grid }),
  })
  if (!res.ok) {
    throw new ApiError(await readError(res, '分析失敗'))
  }
  return res.json()
}

export async function scanImage(file: File): Promise<{ grid: Grid }> {
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch('/api/sudoku/scan', { method: 'POST', body: formData })
  if (!res.ok) {
    throw new ApiError(await readError(res, '辨識失敗'))
  }
  return res.json()
}
