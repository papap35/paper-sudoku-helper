import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, analyzeGrid, scanImage } from './api'
import { emptyGrid, type AnalyzeResult } from './types'

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('analyzeGrid', () => {
  it('posts the grid and returns the parsed analysis', async () => {
    const result: AnalyzeResult = {
      candidates: {},
      conflicts: [],
      hint: null,
      progress: { filled: 81, total: 81, percent: 100, difficulty: '已完成！' },
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(result))
    vi.stubGlobal('fetch', fetchMock)

    const grid = emptyGrid()
    const response = await analyzeGrid(grid)

    expect(response).toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith('/api/sudoku/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid }),
    })
  })

  it('throws an ApiError with the server message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: '盤面格式錯誤' }, false)))

    await expect(analyzeGrid(emptyGrid())).rejects.toThrow(ApiError)
    await expect(analyzeGrid(emptyGrid())).rejects.toThrow('盤面格式錯誤')
  })

  it('falls back to a default message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('not json')),
      } as unknown as Response),
    )

    await expect(analyzeGrid(emptyGrid())).rejects.toThrow('分析失敗')
  })
})

describe('scanImage', () => {
  it('posts the file as form data and returns the recognized grid', async () => {
    const grid = emptyGrid()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ grid }))
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['fake'], 'board.jpg', { type: 'image/jpeg' })
    const response = await scanImage(file)

    expect(response).toEqual({ grid })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/sudoku/scan')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect((options.body as FormData).get('image')).toBe(file)
  })

  it('throws an ApiError with the server message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: '辨識失敗' }, false)))

    const file = new File(['fake'], 'board.jpg', { type: 'image/jpeg' })
    await expect(scanImage(file)).rejects.toThrow(ApiError)
    await expect(scanImage(file)).rejects.toThrow('辨識失敗')
  })
})
