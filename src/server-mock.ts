import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createManyCards } from './data/card/factory'

export const server = setupServer(
  http.get('http://localhost:4100/cards', () => {
    return HttpResponse.json(
      createManyCards(2, {
        content: 'test-content',
      })
    )
  }),
  http.post('http://localhost:4100/cards', () => {
    return HttpResponse.json({})
  })
)
