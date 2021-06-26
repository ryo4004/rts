import express from 'express'
import NeDB from 'nedb'
import path from 'path'
import { createServer } from 'https'
import { Server } from 'socket.io'
import * as lib from './lib'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const client = './client/build'
app.use('/', express.static(client))
app.use('/host', express.static(client))
app.use('/:id', express.static(client))

// データベース準備
const statusDB = new NeDB({
  filename: path.join(__dirname, 'server/database/status.db'),
  autoload: true,
  timestampData: true,
})

statusDB.remove({}, { multi: true }, (err, numRemoved) => {
  console.log('[' + lib.showTime() + '] statusDB refresh: ' + numRemoved)
})

type Status = {
  status: string
  socketid: string
  id: string
  disable: boolean
}

// api設定
app.post('/api/presenter', (req, res) => {
  const id = req.body.id
  console.log('[' + lib.showTime() + '] api/presenter: ' + id)
  statusDB.find({ type: 'presenter' }, (err: unknown, doc: Array<Status>) => {
    res.json({ status: true, doc })
  })
})

app.post('/api/recorder', (req, res) => {
  const id = req.body.id
  console.log('[' + lib.showTime() + '] api/recorder: ' + id)
  statusDB.find({ type: 'recorder' }, (err: unknown, doc: Array<Status>) => {
    if (err || !doc || doc.length === 0) return res.json({ status: true, recorder: false })
    res.json({ status: true, recorder: true })
  })
})

// WebSocketサーバを使用
const server = createServer(app)
const io = new Server(server)

const getSocketID = (id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    statusDB.findOne({ id }, (err, status) => {
      if (err) return resolve([null, 'id error'])
      if (!status) return resolve([null, 'id error'])
      return resolve([status.socketid, null])
    })
  })
}

const getSocketIDWithCheck = (id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    statusDB.findOne({ id }, (err, status) => {
      if (err) return resolve([null, 'id error'])
      if (!status) return resolve([null, 'id error'])
      if (status.disable === true) return resolve([null, 'id error'])
      return resolve([status.socketid, null])
    })
  })
}

function disableSocket(id: string) {
  statusDB.findOne({ id }, (err, status) => {
    // console.log(status)
    if (!status) return
    status.disable = true
    statusDB.update({ id }, status, {}, (err, n) => {})
  })
}

// 接続処理
io.on('connection', (socket) => {
  // URL用ID作成
  const id = lib.shuffle(lib.randomString())
  const reg = { status: 'connection', socketid: socket.client.id, id, disable: false }
  statusDB.insert(reg, (err) => {
    if (err) return console.log('database error')
    // id を通知
    io.to(socket.client.id).emit('connection_complete', { id })
    console.log('(socket)[' + lib.showTime() + '] connect complete: ' + socket.client.id, id)
  })

  // First request from Receiver to Sender
  socket.on('request_to_sender', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] request_to_sender')
    // const fromSocket = await getSocketID(obj.from)
    const [toSocket, toSocketError] = await getSocketIDWithCheck(obj.to)
    disableSocket(obj.to)
    // console.log('from: ', fromSocket)
    console.log('to: ', toSocket)
    if (toSocket) {
      io.to(toSocket).emit('request_to_sender', obj)
    } else {
      const [fromSocket, fromSocketError] = await getSocketID(obj.from)
      io.to(fromSocket).emit('request_to_sender_error', { error: 'not_found' })
    }
  })

  // Reciever send offer SDP
  socket.on('send_offer_sdp', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] send_offer_sdp')
    const [toSocket, toSocketError] = await getSocketID(obj.to)
    io.to(toSocket).emit('send_offer_sdp', obj)
  })

  // Sender send answer SDP
  socket.on('send_answer_sdp', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] send_answer_sdp')
    const [toSocket, toSocketError] = await getSocketID(obj.to)
    io.to(toSocket).emit('send_answer_sdp', obj)
  })

  // お互いに交換
  socket.on('send_found_candidate', async (obj) => {
    const [toSocket, toSocketError] = await getSocketID(obj.to)
    console.log('(socket)[' + lib.showTime() + '] find: from ' + obj.selfType + ' to ' + obj.to)
    // console.log(JSON.stringify(obj.candidate, null, 2))
    io.to(toSocket).emit('send_found_candidate', obj)
  })

  // 接続解除
  socket.on('disconnecting', (reason) => {
    statusDB.findOne({ socketid: socket.client.id }, (err, status) => {
      if (err) return console.log('database error: findOneエラー')
      if (!status) return console.log(socket.client.id + ' not found')
      statusDB.remove({ socketid: socket.client.id }, { multi: false }, (err, numRemoved) => {
        if (err || !numRemoved) return console.log('database error: removeエラー')
        console.log('(socket)[' + lib.showTime() + '] disconnect complete: ' + socket.client.id, reason)
      })
    })
  })
})

const PORT_NUMBER = 3003
app.listen(PORT_NUMBER)
