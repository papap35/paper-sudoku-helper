import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiError, analyzeGrid, scanImage } from './api'
import { emptyGrid, type AnalyzeResult } from './types'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    analyzeGrid: vi.fn(),
    scanImage: vi.fn(),
  }
})

function baseResult(overrides: Partial<AnalyzeResult> = {}): AnalyzeResult {
  return {
    candidates: {},
    conflicts: [],
    hint: null,
    progress: { filled: 2, total: 81, percent: 2.5, difficulty: '簡單' },
    ...overrides,
  }
}

function getCellInput(container: HTMLElement, r: number, c: number): HTMLInputElement {
  const inputs = container.querySelectorAll<HTMLInputElement>('.cell-input')
  return inputs[r * 9 + c]
}

beforeEach(() => {
  vi.mocked(analyzeGrid).mockReset()
  vi.mocked(scanImage).mockReset()
  URL.createObjectURL = vi.fn(() => 'blob:fake-url')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the board with 81 cells', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('.cell-input')).toHaveLength(81)
  })

  it('shows a conflict message and marks conflicting cells when conflicts are found', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockResolvedValue(
      baseResult({ conflicts: [[0, 0], [0, 1]] }),
    )

    const { container } = render(<App />)
    await user.type(getCellInput(container, 0, 0), '5')
    await user.type(getCellInput(container, 0, 1), '5')
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))

    expect(await screen.findByText('⚠️ 標記為紅色的格子互相衝突，請先修正。')).toBeInTheDocument()
    expect(container.querySelectorAll('.cell.conflict')).toHaveLength(2)
  })

  it('shows the hint message returned by the API', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockResolvedValue(
      baseResult({
        hint: {
          technique: 'naked_single',
          technique_name: '唯一候選數 (Naked Single)',
          message: '看看第 5 列、第 5 欄這一格——把其他規則排除後，它只剩下一個可能的數字了。',
          cells: [[4, 4]],
          difficulty: '簡單',
        },
      }),
    )

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))

    expect(
      await screen.findByText('💡 唯一候選數 (Naked Single)：看看第 5 列、第 5 欄這一格——把其他規則排除後，它只剩下一個可能的數字了。'),
    ).toBeInTheDocument()
  })

  it('shows a completion message when the board is full', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockResolvedValue(
      baseResult({ progress: { filled: 81, total: 81, percent: 100, difficulty: '已完成！' } }),
    )

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))

    expect(await screen.findByText('🎉 恭喜完成！')).toBeInTheDocument()
  })

  it('shows a fallback message when there is no hint and the board is not complete', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockResolvedValue(baseResult())

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))

    expect(
      await screen.findByText('目前盤面看起來沒有衝突，但找不到更簡單的提示了，可能需要更進階的技巧。'),
    ).toBeInTheDocument()
  })

  it('shows the API error message when analyze fails', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockRejectedValue(new ApiError('盤面格式錯誤'))

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))

    const message = await screen.findByText('盤面格式錯誤')
    expect(message).toHaveStyle({ color: '#c0392b' })
  })

  it('shows a generic error message for non-API errors', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockRejectedValue(new Error('network down'))

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))

    expect(await screen.findByText('連線失敗，請稍後再試。')).toBeInTheDocument()
  })

  it('asks the user to analyze first when hint is clicked without analysis', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '給我一個提示' }))

    const message = await screen.findByText('請先按「分析盤面」')
    expect(message).toHaveStyle({ color: '#c0392b' })
  })

  it('highlights hint cells when hint is clicked after analysis', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockResolvedValue(
      baseResult({
        hint: {
          technique: 'naked_single',
          technique_name: '唯一候選數 (Naked Single)',
          message: '訊息',
          cells: [[4, 4]],
          difficulty: '簡單',
        },
      }),
    )

    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))
    await screen.findByText('💡 唯一候選數 (Naked Single)：訊息')

    await user.click(screen.getByRole('button', { name: '給我一個提示' }))

    const cells = container.querySelectorAll('.cell')
    expect(cells[4 * 9 + 4]).toHaveClass('hint')
  })

  it('clears the board and analysis state when clear is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeGrid).mockResolvedValue(baseResult())

    const { container } = render(<App />)
    await user.type(getCellInput(container, 0, 0), '5')
    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))
    await screen.findByText('目前盤面看起來沒有衝突，但找不到更簡單的提示了，可能需要更進階的技巧。')

    await user.click(screen.getByRole('button', { name: '清空盤面' }))

    expect(getCellInput(container, 0, 0).value).toBe('')
    expect(document.querySelector('.hint-text')).toHaveTextContent('')
  })

  it('scans an uploaded image and fills the board with the recognized grid', async () => {
    const user = userEvent.setup()
    const recognizedGrid = emptyGrid()
    recognizedGrid[0][0] = 7
    vi.mocked(scanImage).mockResolvedValue({ grid: recognizedGrid })

    const { container } = render(<App />)
    const file = new File(['fake'], 'board.jpg', { type: 'image/jpeg' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await user.click(screen.getByRole('button', { name: '辨識盤面' }))

    expect(getCellInput(container, 0, 0)).toHaveValue('7')
    expect(
      await screen.findByText('辨識完成，請確認盤面是否正確（可手動修正），再按「分析盤面」。'),
    ).toBeInTheDocument()
  })

  it('shows an error message when scanning fails', async () => {
    const user = userEvent.setup()
    vi.mocked(scanImage).mockRejectedValue(new ApiError('辨識失敗'))

    const { container } = render(<App />)
    const file = new File(['fake'], 'board.jpg', { type: 'image/jpeg' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: '辨識盤面' }))

    const message = await screen.findByText('辨識失敗')
    expect(message).toHaveStyle({ color: '#c0392b' })
  })
})
