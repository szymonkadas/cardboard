import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { Mock, vi } from 'vitest'
import { CardDto, CardModel } from '../../../../data'
import { Card } from '../../../Card/Card'
import { CardAddNew } from '../../../Card/CardAddNew'
import { Board } from '../../Board'
import BoardContainer from '../../Board.container'
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

  beforeEach(() => {})
  afterEach(() => {
    cleanup()
  })

  test('mock ver - Check if clicking on <AddNewCard /> adds new card to database, and displays it correctly in <Board />', () => {
    // post request mock: hence i can't work on remote database then work on variable db, and make changes locally.
    const mockOnAddCard = vi.fn(async () => {
      const newCard = new CardModel(newCardProps)
      cardsData.cards = [...cardsData.cards, newCard]
    })
    const mockOnUpdateCard = vi.fn()
    const mockOnDeleteCard = vi.fn()
    const { rerender } = render(
      BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
    )
    boardRerender = rerender

    const boardPointer = screen.getByTestId('board')
    // add new card
    const cardAddNewPointer = screen.getByTestId('card-add-new')
    fireEvent.click(cardAddNewPointer)
    // rerender component because of changes (can't interact with state so...)
    boardRerender(BoardContainerMock(vi.fn(), vi.fn(), vi.fn()))
    // check if added to db:
    expect(cardsData).toEqual({
      cards: [newCardProps],
    })
    // check for correct display:
    expect(boardPointer).toHaveTextContent(newCardProps.content)
  })
  test('msw ver - Check if clicking on <AddNewCard /> adds new card to database, and displayis it correctly in <Board />', async () => {
    // waiting for state change when rendering BoardContainer (first useEffect);
    await waitFor(() => {
      render(<BoardContainer></BoardContainer>)
    })
    const boardPointer = screen.getByTestId('board')
    // add new card
    const cardAddNewPointer = screen.getByTestId('card-add-new')
    await waitFor(() => {
      fireEvent.click(cardAddNewPointer)
    })
    // could have put it in waitFor but for unknown reasons options don't help when it's wrong, and the test just keeps on going for eternity, hence first waitFor got introduced.
    expect(boardPointer).toHaveTextContent('Click to start noting')
  })

  const BoardContainerMock = (
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
