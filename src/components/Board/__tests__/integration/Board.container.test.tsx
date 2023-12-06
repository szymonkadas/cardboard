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
import { Card } from '../../../Card/Card'
import { CardAddNew } from '../../../Card/CardAddNew'
import { Board } from '../../Board'
import BoardContainer from '../../Board.container'

interface CardsData {
  cards: CardDto[]
}

describe('BoardContainer integration tests', () => {
  // DB
  let cardsData: CardsData = {
    cards: createManyCards(2, { content: 'test-content' }),
  }
  const cardsDataCopy = { ...cardsData }
  // cardObjectData
  const newCardProps = {
    id: 10,
    content: 'yadda yadda',
    createdAt: 'now',
  }

  afterEach(() => {
    cardsData = { ...cardsDataCopy }
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
      mockOnDeleteCard = vi.fn((cardId: number) => {
        cardsData.cards = cardsData.cards.filter((card) => card.id !== cardId)
      })
    })

    test('Check if clicking on <AddNewCard /> adds new card to database, and displays it correctly in <Board />', async () => {
      const { rerender } = render(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      const boardPointer = screen.getByTestId('board')
      await addCard()
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

    test('Check if updating selected card content works correctly', async () => {
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

    test('Check if deleting selected card works correctly when pressing Backspace when card content is empty', async () => {
      const { rerender } = render(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      newCardProps.content = ''
      await addCard()
      expect(cardsData).not.toEqual(cardsDataCopy)
      rerender(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      const cardPointer = screen.getByTestId(
        `card-${cardsData.cards[cardsData.cards.length - 1].id}`
      )

      await waitFor(async () => {
        // screen.debug()
        await userEvent.click(cardPointer)
        await userEvent.type(cardPointer, '{backspace}')
        expect(mockOnDeleteCard).toHaveBeenCalled()
      })
      rerender(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      // check ui
      expect(cardPointer).not.toBeInTheDocument()
      // check db
      expect(cardsData).toEqual(cardsDataCopy)
    })

    test("Check if pressing Backspace is not deleting card when it's content is not empty", async () => {
      const { rerender } = render(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      const cardPointer = screen.getByTestId(
        `card-${cardsData.cards[cardsData.cards.length - 1].id}`
      )

      if (cardsData.cards[cardsData.cards.length - 1].content === '') {
        await waitFor(async () => {
          userEvent.click(cardPointer)
          // populate the card with some data.
          userEvent.type(cardPointer, 'content')
          // blur it out so it will be setupped well for test.
          userEvent.tab()
        })
        rerender(
          BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
        )
      }
      await waitFor(async () => {
        userEvent.click(cardPointer)
        userEvent.type(cardPointer, '{backspace}')
      })
      rerender(
        BoardContainerMock(mockOnUpdateCard, mockOnDeleteCard, mockOnAddCard)
      )
      // UI
      expect(cardPointer).toBeInTheDocument()
      // nothing got deleted, so it should remain same. DB.
      expect(cardsData.cards.length).toBe(cardsDataCopy.cards.length)
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

    test('Check if clicking on <AddNewCard /> adds new card to database, and displayis it correctly in <Board />', async () => {
      const boardPointer = screen.getByTestId('board')
      await addCard()
      expect(boardPointer).toHaveTextContent('Click to start noting')
    })

    test('Check if updating selected card content works correctly', async () => {
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

    test('Check if deleting selected card works correctly when pressing Backspace when card content is empty', async () => {
      await addCard()
      const cardsData = await fetchCards()
      const cardPointer = screen.getByTestId(
        `card-${cardsData[cardsData.length - 1].id}`
      )
      await waitFor(async () => {
        userEvent.click(cardPointer)
        userEvent.type(cardPointer, '{backspace}')
        // check db
        expect(cardsData.slice(0, cardsData.length - 1)).toEqual(
          await fetchCards()
        )
      })
      // check ui
      expect(cardPointer).not.toBeInTheDocument()
    })

    test("Check if pressing Backspace is not deleting card when it's content is not empty", async () => {
      const cardsData = await fetchCards()
      const cardPointer = screen.getByTestId(
        `card-${cardsData[cardsData.length - 1].id}`
      )
      if (cardsData[cardsData.length - 1].content === '') {
        await waitFor(async () => {
          userEvent.click(cardPointer)
          // populate the card with some data.
          userEvent.type(cardPointer, 'content')
          // blur it out so it will be setupped well for test.
          userEvent.tab()
        })
      }
      await waitFor(async () => {
        userEvent.click(cardPointer)
        userEvent.type(cardPointer, '{backspace}')
      })
      // UI
      expect(cardPointer).toBeInTheDocument()
      // nothing got deleted, so it should remain same. DB.
      expect(cardsData).toEqual(await fetchCards())
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

async function addCard() {
  // add new card
  const cardAddNewPointer = screen.getByTestId('card-add-new')
  await waitFor(() => {
    fireEvent.click(cardAddNewPointer)
  })
  return { cardAddNewPointer }
}
