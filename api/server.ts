import app from './index'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
