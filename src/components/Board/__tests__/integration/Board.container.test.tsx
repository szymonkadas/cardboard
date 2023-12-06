import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { Mock, vi } from 'vitest'
import { CardDto, CardModel } from '../../../../data'
import { createManyCards } from '../../../../data/card/factory'
import { generateId } from '../../../../utils/generators'
import { Card } from '../../../Card/Card'
import { CardAddNew } from '../../../Card/CardAddNew'
import { Board } from '../../Board'
import BoardContainer from '../../Board.container'

interface CardsData {
  cards: CardDto[]
}

describe('BoardContainer integration tests', () => {
  // DB
  const cardsData: CardsData = {
    cards: createManyCards(2, { content: 'test-content' }),
  }
  const cardsDataCopy = { ...cardsData }
  // cardObjectData
  const newCardProps = {
    id: generateId(),
    content: 'yadda yadda',
    createdAt: new Date().toISOString(),
  }

  afterEach(() => {
    cleanup()
  })

  describe('Tests using mocks', async () => {
    let mockOnAddCard: Mock
    let mockOnUpdateCard: Mock
    let mockOnDeleteCard: Mock
    beforeEach(() => {
      mockOnAddCard = vi.fn(async () => {
        const newCard = new CardModel(newCardProps)
        cardsData.cards = [...cardsData.cards, newCard]
      })
      mockOnUpdateCard = vi.fn((cardData: CardDto) => {
        cardsData.cards = cardsData.cards.map((card) =>
          card.id === cardData.id ? cardData : card
        )
      })
      mockOnDeleteCard = vi.fn()
    })

    test('Check if clicking on <AddNewCard /> adds new card to database, and displays it correctly in <Board />', async () => {
      const { rerender } = render(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      const boardPointer = screen.getByTestId('board')
      // add new card
      const cardAddNewPointer = screen.getByTestId('card-add-new')
      await waitFor(() => {
        fireEvent.click(cardAddNewPointer)
      })
      // rerender component because of changes (can't interact with state so...)
      rerender(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      // check if added to db:
      expect(cardsData).toEqual({
        cards: [...cardsDataCopy.cards, newCardProps],
      })
      // check for correct display:
      expect(boardPointer).toHaveTextContent(newCardProps.content)
    })

    test('mock ver - Check if updating selected card content works correctly', async () => {
      const { rerender } = render(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      const cardPointer = screen.getByTestId(`card-${cardsData.cards[0].id}`)
      const newContentValue = 'changed content'
      await editCardContent(cardPointer, newContentValue)
      // check db
      expect(cardsData.cards[0].content).toContain(newContentValue)
      // check ui, rerender because can't interact with state
      rerender(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      expect(cardPointer).toHaveTextContent(newContentValue)
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

  describe('Tests using msw', async () => {
    beforeEach(async () => {
      await act(async () => {
        render(<BoardContainer />)
      })
    })
    test('msw ver - Check if clicking on <AddNewCard /> adds new card to database, and displayis it correctly in <Board />', async () => {
      const boardPointer = screen.getByTestId('board')
      // add new card
      const cardAddNewPointer = screen.getByTestId('card-add-new')
      await waitFor(() => {
        fireEvent.click(cardAddNewPointer)
      })
      expect(boardPointer).toHaveTextContent('Click to start noting')
    })

    test('msw ver - Check if updating selected card content works correctly', async () => {
      const cardsData = await fetchCards()
      const cardPointer = screen.getByTestId(`card-${cardsData[0].id}`)
      const newContentValue = 'changed content'
      await editCardContent(cardPointer, newContentValue)
      // check ui
      expect(cardPointer).toHaveTextContent(newContentValue)
      // check db
      // when clicking on item, and there's already some text content, everything typed in without any special interactions get inserted before previous content. Hence used toContain.
      expect((await fetchCards())[0].content).toContain(newContentValue)
    })
  })
})

async function fetchCards(): Promise<CardDto[]> {
  return await fetch(`http://localhost:4100/cards`).then((res) => res.json())
}

async function editCardContent(
  cardPointer: HTMLElement,
  newContentValue: string
) {
  await waitFor(async () => {
    await userEvent.click(cardPointer)
    await userEvent.type(cardPointer, newContentValue)
    await userEvent.tab()
  })
}
