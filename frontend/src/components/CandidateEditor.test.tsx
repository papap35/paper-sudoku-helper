import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CandidateEditor from './CandidateEditor'
import { emptyGrid } from '../types'

describe('CandidateEditor', () => {
  it('renders 9 digit buttons and highlights selected ones', () => {
    const grid = emptyGrid()
    render(<CandidateEditor grid={grid} cell={[0, 0]} selected={new Set([2, 4])} onToggle={vi.fn()} onClose={vi.fn()} />)

    const buttons = screen.getAllByRole('button', { name: /^[1-9]$/ })
    expect(buttons).toHaveLength(9)
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: '4' })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: '1' })).not.toHaveClass('selected')
  })

  it('calls onToggle with the clicked digit', () => {
    const onToggle = vi.fn()
    const grid = emptyGrid()
    render(<CandidateEditor grid={grid} cell={[0, 0]} selected={new Set()} onToggle={onToggle} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onToggle).toHaveBeenCalledWith(5)
  })

  it('marks a selected digit as invalid and shows a warning when it conflicts with the grid', () => {
    const grid = emptyGrid()
    grid[0][1] = 4

    render(<CandidateEditor grid={grid} cell={[0, 0]} selected={new Set([4])} onToggle={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: '4' })).toHaveClass('invalid')
    expect(screen.getByText(/不可能填在這格/)).toBeInTheDocument()
  })

  it('does not show a warning when all selected digits are still possible', () => {
    const grid = emptyGrid()

    render(<CandidateEditor grid={grid} cell={[0, 0]} selected={new Set([4])} onToggle={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: '4' })).not.toHaveClass('invalid')
    expect(screen.queryByText(/不可能填在這格/)).toBeNull()
  })

  it('calls onClose when clicking the overlay or the close button', () => {
    const onClose = vi.fn()
    const grid = emptyGrid()
    const { container } = render(
      <CandidateEditor grid={grid} cell={[0, 0]} selected={new Set()} onToggle={vi.fn()} onClose={onClose} />,
    )

    fireEvent.click(container.querySelector('.candidate-editor-overlay')!)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: '完成' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('does not close when clicking inside the editor panel', () => {
    const onClose = vi.fn()
    const grid = emptyGrid()
    const { container } = render(
      <CandidateEditor grid={grid} cell={[0, 0]} selected={new Set()} onToggle={vi.fn()} onClose={onClose} />,
    )

    fireEvent.click(container.querySelector('.candidate-editor')!)
    expect(onClose).not.toHaveBeenCalled()
  })
})
