import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.html('<h1></h1>Hello Hono!</h1>')
})

export default app
