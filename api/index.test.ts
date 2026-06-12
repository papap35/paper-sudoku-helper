import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('./sudokuOcr', () => ({
  extractGridFromImage: vi.fn(),
}))

import app from './index'
import { extractGridFromImage } from './sudokuOcr'

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

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('POST /api/sudoku/analyze', () => {
  it('returns analysis for a valid grid', async () => {
    const res = await request(app).post('/api/sudoku/analyze').send({ grid: SOLVED_GRID })
    expect(res.status).toBe(200)
    expect(res.body.progress).toEqual({
      filled: 81,
      total: 81,
      percent: 100,
      difficulty: '已完成！',
    })
  })

  it('rejects a grid with the wrong shape', async () => {
    const res = await request(app).post('/api/sudoku/analyze').send({ grid: [[1, 2, 3]] })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: '盤面格式錯誤，請確認是 9x9、內容為 0-9 的數字' })
  })

  it('rejects a missing grid', async () => {
    const res = await request(app).post('/api/sudoku/analyze').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: '盤面格式錯誤，請確認是 9x9、內容為 0-9 的數字' })
  })
})

describe('POST /api/sudoku/scan', () => {
  it('rejects requests without an image file', async () => {
    const res = await request(app).post('/api/sudoku/scan')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: '請上傳一張數獨盤面照片' })
  })

  it('returns the recognized grid on success', async () => {
    vi.mocked(extractGridFromImage).mockResolvedValueOnce(SOLVED_GRID)

    const res = await request(app)
      .post('/api/sudoku/scan')
      .attach('image', Buffer.from('fake-image-data'), { filename: 'board.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ grid: SOLVED_GRID })
    expect(extractGridFromImage).toHaveBeenCalledWith(expect.any(Buffer), 'image/jpeg')
  })

  it('returns a friendly error when recognition fails', async () => {
    vi.mocked(extractGridFromImage).mockRejectedValueOnce(new Error('boom'))

    const res = await request(app)
      .post('/api/sudoku/scan')
      .attach('image', Buffer.from('fake-image-data'), { filename: 'board.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: '辨識失敗，請換一張較清晰的照片，或直接手動輸入' })
  })
})
