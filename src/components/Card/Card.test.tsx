import { fireEvent, render, screen } from '@testing-library/react'
import { Mock, vi } from 'vitest'
import { createCard } from '../../data/card/factory'
import { Card } from './Card'

describe('Card component unit tests', () => {
  const cardMock = createCard({
    content: 'Test content',
  })
  let mockOnUpdateCard: Mock<any, any> = vi.fn()
  beforeEach(() => {
    mockOnUpdateCard = vi.fn()
    render(<Card {...cardMock} onUpdateCard={mockOnUpdateCard} />)
  })
  test('check if clicking on Card component enters edit mode', () => {
    const { editModePointer } = clickOnCardComponent(cardMock.id)
    expect(editModePointer).toBeDefined()
  })
  test('check if clicking outside edit mode exits edit mode', () => {
    const { editModePointer } = exitEditModeOfCardComponent(cardMock.id)
    expect(editModePointer).not.toBeInTheDocument()
  })
  test('check if onUpdateCard is being fired when exiting edit mode', () => {
    exitEditModeOfCardComponent(cardMock.id)
    expect(mockOnUpdateCard).toHaveBeenCalled()
  })
  test('check if value on textarea is being set when firing change event in edit mode', () => {
    const newVal = 'changedVal'
    const { editModePointer } = clickOnCardComponent(cardMock.id)
    fireEvent.change(editModePointer, { target: { value: newVal } })
    expect(editModePointer.value).toBe(newVal)
  })
})

function clickOnCardComponent(cardId: number) {
  const cardPointer = screen.getByTestId(`card-${cardId}`)
  fireEvent.click(cardPointer)
  const editModePointer = screen.getByRole('textbox') as HTMLTextAreaElement
  return { cardPointer, editModePointer }
}

function exitEditModeOfCardComponent(cardId: number) {
  const { editModePointer } = clickOnCardComponent(cardId)
  fireEvent.blur(editModePointer)
  return { editModePointer }
}
