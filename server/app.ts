import express from 'express'

const app = express()

const client = './client/build'
app.use('/', express.static(client))

const PORT_NUMBER = 3003
app.listen(PORT_NUMBER)
