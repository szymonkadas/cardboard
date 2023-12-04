import { fireEvent, render, screen } from '@testing-library/react'
import { Mock, vi } from 'vitest'
import { CardDto, CardModel } from '../../../../data'
import { Card } from '../../../Card/Card'
import { CardAddNew } from '../../../Card/CardAddNew'
import { Board } from '../../Board'

interface CardsData {
  cards: CardDto[]
}

describe('BoardContainer integration tests', () => {
  // DB
  const cardsData: CardsData = { cards: [] }
  // cardObjectData
  const newCardProps = {
    id: 10,
    content: 'yadda yadda',
    createdAt: 'now',
  }
  let boardRerender: (
    ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>
  ) => void

  beforeEach(() => {
    // post request mock: hence i can't work on remote database then work on variable db, and make changes locally.
    const mockOnAddCard = vi.fn(async () => {
      const newCard = new CardModel(newCardProps)
      cardsData.cards = [...cardsData.cards, newCard]
    })
    const mockOnUpdateCard = vi.fn()
    const mockOnDeleteCard = vi.fn()
    const { rerender } = render(
      BoardContainer(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
    )
    boardRerender = rerender
  })

  test('Check  if clicking on <AddNewCard /> adds new card to database, and displays it correctly in <Board /> ', () => {
    const boardPointer = screen.getByTestId('board')
    // add new card
    const cardAddNewPointer = screen.getByTestId('card-add-new')
    fireEvent.click(cardAddNewPointer)
    // rerender component because of changes (can't interact with state so...)
    boardRerender(BoardContainer(vi.fn(), vi.fn(), vi.fn()))
    // check if added to db:
    expect(cardsData).toEqual({
      cards: [newCardProps],
    })
    // check for correct display:
    expect(boardPointer).toHaveTextContent(newCardProps.content)
  })

  const BoardContainer = (
    mockOnUpdateCard: Mock,
    mockOnDeleteCard: Mock,
    mockOnAddCard: Mock<[], Promise<void>>
  ) => {
    return (
      <Board>
        {cardsData.cards.map((cardProps) => (
          <Card
            key={cardProps.id}
            id={cardProps.id}
            content={cardProps.content}
            createdAt={cardProps.createdAt}
            onUpdateCard={mockOnUpdateCard}
            onDeleteCard={mockOnDeleteCard}
          />
        ))}
        <CardAddNew onAddCard={mockOnAddCard} />{' '}
      </Board>
    )
  }
})
