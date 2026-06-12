import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusPanel from './StatusPanel'
import type { AnalyzeResult } from '../types'

const ANALYSIS: AnalyzeResult = {
  candidates: {},
  conflicts: [],
  hint: null,
  progress: { filled: 30, total: 81, percent: 37, difficulty: '簡單' },
}

describe('StatusPanel', () => {
  it('renders an empty progress text when there is no analysis yet', () => {
    render(<StatusPanel analysis={null} hintText="" message={null} />)
    expect(document.querySelector('.progress-text')).toHaveTextContent('')
    expect(document.querySelector('.progress-fill')).toHaveStyle({ width: '0%' })
  })

  it('renders progress, hint text and width based on the analysis', () => {
    render(<StatusPanel analysis={ANALYSIS} hintText="💡 提示內容" message={null} />)

    expect(document.querySelector('.progress-text')?.textContent).toBe('已填入 30 / 81 格 (37%)　目前難度：簡單')
    expect(screen.getByText('💡 提示內容')).toBeInTheDocument()
    expect(document.querySelector('.progress-fill')).toHaveStyle({ width: '37%' })
  })

  it('shows error messages in red and success messages in green', () => {
    const { rerender } = render(
      <StatusPanel analysis={null} hintText="" message={{ text: '發生錯誤', isError: true }} />,
    )
    expect(screen.getByText('發生錯誤')).toHaveStyle({ color: '#c0392b' })

    rerender(<StatusPanel analysis={null} hintText="" message={{ text: '完成', isError: false }} />)
    expect(screen.getByText('完成')).toHaveStyle({ color: '#3a8a3a' })
  })
})
