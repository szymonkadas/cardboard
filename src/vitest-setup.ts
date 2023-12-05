import '@testing-library/jest-dom'
import { server } from './server-mock'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
