import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UploadBox from './UploadBox'

describe('UploadBox', () => {
  it('calls onFileChange when a file is selected', async () => {
    const user = userEvent.setup()
    const onFileChange = vi.fn()

    render(
      <UploadBox previewUrl={null} scanning={false} canScan={false} onFileChange={onFileChange} onScan={vi.fn()} />,
    )

    const file = new File(['fake'], 'board.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('📷 拍照 / 上傳數獨照片', { exact: false }) as HTMLInputElement
    await user.upload(input, file)

    expect(onFileChange).toHaveBeenCalledWith(file)
  })

  it('disables the scan button until a file can be scanned', () => {
    const { rerender } = render(
      <UploadBox previewUrl={null} scanning={false} canScan={false} onFileChange={vi.fn()} onScan={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: '辨識盤面' })).toBeDisabled()

    rerender(<UploadBox previewUrl={null} scanning={false} canScan={true} onFileChange={vi.fn()} onScan={vi.fn()} />)
    expect(screen.getByRole('button', { name: '辨識盤面' })).toBeEnabled()
  })

  it('shows a scanning label and disables the button while scanning', () => {
    render(<UploadBox previewUrl={null} scanning={true} canScan={true} onFileChange={vi.fn()} onScan={vi.fn()} />)
    const button = screen.getByRole('button', { name: '辨識中...' })
    expect(button).toBeDisabled()
  })

  it('calls onScan when the scan button is clicked', async () => {
    const user = userEvent.setup()
    const onScan = vi.fn()

    render(<UploadBox previewUrl={null} scanning={false} canScan={true} onFileChange={vi.fn()} onScan={onScan} />)
    await user.click(screen.getByRole('button', { name: '辨識盤面' }))

    expect(onScan).toHaveBeenCalledTimes(1)
  })

  it('renders a preview image when previewUrl is set', () => {
    const { container } = render(
      <UploadBox previewUrl="blob:fake-url" scanning={false} canScan={true} onFileChange={vi.fn()} onScan={vi.fn()} />,
    )

    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:fake-url')
  })
})
