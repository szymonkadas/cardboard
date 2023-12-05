import { fireEvent, render, screen } from '@testing-library/react'
import { Mock, vi } from 'vitest'
import { CardAddNew } from './CardAddNew'

describe('CardAddNew component unit tests', () => {
  let mockOnAddCard: Mock<any, any>
  beforeEach(() => {
    mockOnAddCard = vi.fn()
  })
  test('Check if clicking on <CardAddNew /> fires onAddCard handler when component is not disabled', () => {
    cardTestSetup(false, mockOnAddCard)
    expect(mockOnAddCard).toHaveBeenCalled()
  })
  test('Check  if clicking on <CardAddNew /> fires onAddCard handler when component is disabled', () => {
    cardTestSetup(true, mockOnAddCard)
    expect(mockOnAddCard).not.toHaveBeenCalled()
  })
})

function cardTestSetup(disabled: boolean, mockOnAddCard: Mock) {
  render(<CardAddNew onAddCard={mockOnAddCard} disabled={disabled} />)
  const cardAddNewPointer: HTMLButtonElement =
    screen.getByTestId('card-add-new')
  fireEvent.click(cardAddNewPointer)
  return { cardAddNewPointer }
}
