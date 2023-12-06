import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { CardModelData } from './data'
import { createManyCards } from './data/card/factory'

const cardsPath = `http://localhost:4100/cards`

type DataBase = {
  cards: CardModelData[]
  modifiedCard?: CardModelData
}
const db: DataBase = {
  cards: createManyCards(2, {
    content: 'test-content',
  }),
  modifiedCard: undefined,
}

export const server = setupServer(
  http.get(cardsPath, () => {
    return HttpResponse.json(db.cards)
  }),

  http.post(cardsPath, async ({ request }) => {
    db.cards.push({ ...((await request.json()) as CardModelData) })
    return HttpResponse.json({})
  }),

  http.put(`${cardsPath}/:id`, async ({ params, request }) => {
    const modifiedCardIndex = db.cards.findIndex(
      (card) => `${card.id}` === params.id
    )

    if (modifiedCardIndex >= 0) {
      // because i can't assign this to normal variable and somehow it works on property then that's my way of mocking it
      db.modifiedCard = (await request.json()) as CardModelData
      db.cards[modifiedCardIndex] = db.modifiedCard
      db.modifiedCard = undefined
    } else {
      return HttpResponse.json({
        success: false,
        message: "Card didn't update",
      })
    }

    return HttpResponse.json({
      success: true,
      message: 'Card updated successfully',
    })
  }),
  http.delete(`${cardsPath}/:id`, ({ params }) => {
    db.cards = db.cards.filter((card) => `${card.id}` !== params.id)
    return HttpResponse.json({
      success: true,
      message: 'Card deleted successfully',
    })
  })
)
