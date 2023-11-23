import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createCard } from '../../data/card/factory'
import { Card } from './Card'

describe('Card', () => {
  const cardMock = createCard({
    content: 'Test content',
  })

  it('enters edit mode on click', () => {
    render(<Card {...cardMock} />)

    const card = screen.getByText('Test content')
    fireEvent.click(card)

    // Assuming edit mode shows a textarea, replace with your actual edit mode UI element
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('exits edit mode on click outside', () => {
    // Render the component and enter edit mode
    render(<Card {...cardMock} />)
    fireEvent.click(screen.getByText('Test content'))

    // Exit edit mode
    fireEvent.blur(screen.getByRole('textbox'))

    // Assuming edit mode is exited by hiding a textarea
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('fires onUpdateCard when exiting edit mode', () => {
    const mockUpdateCard = vi.fn()
    render(<Card {...cardMock} onUpdateCard={mockUpdateCard} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Test content'))

    // Exit edit mode
    fireEvent.blur(screen.getByRole('textbox'))

    // Check if onUpdateCard was called
    expect(mockUpdateCard).toHaveBeenCalled()
  })

  it('sets textarea value on change in edit mode', () => {
    render(<Card {...cardMock} />)

    // Enter edit mode
    fireEvent.click(screen.getByText('Test content'))

    // Find the textarea and change its value
    const textarea: HTMLInputElement = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'New content' } })

    // Check if the new value is set
    expect(textarea.value).toBe('New content')
  })
})
