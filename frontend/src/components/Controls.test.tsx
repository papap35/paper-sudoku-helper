import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Controls from './Controls'

describe('Controls', () => {
  it('calls the relevant handlers when buttons are clicked', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    const onHint = vi.fn()
    const onClear = vi.fn()
    const onToggleCandidates = vi.fn()

    render(
      <Controls
        showCandidates={false}
        onAnalyze={onAnalyze}
        onHint={onHint}
        onClear={onClear}
        onToggleCandidates={onToggleCandidates}
      />,
    )

    await user.click(screen.getByRole('button', { name: '分析盤面（候選數字 / 錯誤檢查）' }))
    expect(onAnalyze).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '給我一個提示' }))
    expect(onHint).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '清空盤面' }))
    expect(onClear).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('checkbox', { name: '顯示候選數字' }))
    expect(onToggleCandidates).toHaveBeenCalledWith(true)
  })

  it('reflects the showCandidates prop in the checkbox state', () => {
    render(
      <Controls
        showCandidates={true}
        onAnalyze={vi.fn()}
        onHint={vi.fn()}
        onClear={vi.fn()}
        onToggleCandidates={vi.fn()}
      />,
    )

    expect(screen.getByRole('checkbox', { name: '顯示候選數字' })).toBeChecked()
  })
})
