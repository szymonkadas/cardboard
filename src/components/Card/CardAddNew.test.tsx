import { fireEvent, render, screen } from '@testing-library/react'
import { Mock, vi } from 'vitest'
import { CardAddNew } from './CardAddNew'

describe('CardAddNew component unit tests', () => {
  let mockOnAddCard: Mock<any, any>
  let cardAddNewPointer: HTMLButtonElement
  beforeEach(() => {
    mockOnAddCard = vi.fn()
  })
  test('Check if clicking on <CardAddNew /> fires onAddCard handler when component is not disabled', () => {
    cardTestSetup(false)
    expect(mockOnAddCard).toHaveBeenCalled()
  })
  test('Check  if clicking on <CardAddNew /> fires onAddCard handler when component is disabled', () => {
    cardTestSetup(true)
    expect(mockOnAddCard).not.toHaveBeenCalled()
  })

  function cardTestSetup(disabled: boolean) {
    render(<CardAddNew onAddCard={mockOnAddCard} disabled={disabled} />)
    cardAddNewPointer = screen.getByTestId('card-add-new')
    fireEvent.click(cardAddNewPointer)
  }
})
