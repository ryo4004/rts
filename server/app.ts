import express from 'express'
import NeDB from 'nedb'
import path from 'path'
import { createServer as createServerHttps } from 'https'
import { createServer as createServerHttp } from 'http'
import fs from 'fs'
import { Server } from 'socket.io'
import * as lib from './lib'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 本番環境ではhttpsを使わない
const PRODUCTION = process.env.PRODUCTION

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
const options = {
  key: fs.readFileSync('./keys/privkey1.pem'),
  cert: fs.readFileSync('./keys/cert1.pem'),
}
const server = PRODUCTION ? createServerHttp(app) : createServerHttps(options, app)
const io = new Server(server)

const getSocketID = (id: string): Promise<[string, null] | [null, string]> => {
  return new Promise((resolve) => {
    statusDB.findOne({ id }, (err, status) => {
      if (err) return resolve([null, 'id error'])
      if (!status) return resolve([null, 'id error'])
      return resolve([status.socketid, null])
    })
  })
}

const getSocketIDWithCheck = (id: string): Promise<[string, null] | [null, string]> => {
  return new Promise((resolve) => {
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
    if (!status) return
    status.disable = true
    statusDB.update({ id }, status, {}, () => {
      console.log('disableSocket: done')
    })
  })
}

// 接続処理
io.on('connection', (socket) => {
  // URL用ID作成
  const id = lib.shuffle(lib.randomString())
  const reg = { status: 'connection', socketid: socket.id, id, disable: false }
  statusDB.insert(reg, (err) => {
    if (err) return console.log('database error')
    // id を通知
    io.to(socket.id).emit('connection_complete', { id })
    console.log('(socket)[' + lib.showTime() + '] connect complete: ' + socket.id, id)
  })

  // First request from Receiver to Sender
  socket.on('request_to_sender', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] request_to_sender')
    const [toSocket] = await getSocketIDWithCheck(obj.to)
    disableSocket(obj.to)
    console.log('to: ', toSocket)
    if (toSocket) {
      io.to(toSocket).emit('request_to_sender', obj)
    } else {
      const [fromSocket] = await getSocketID(obj.from)
      fromSocket && io.to(fromSocket).emit('request_to_sender_error', { error: 'not_found' })
    }
  })

  // Reciever send offer SDP
  socket.on('send_offer_sdp', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] send_offer_sdp')
    const [toSocket] = await getSocketID(obj.to)
    toSocket && io.to(toSocket).emit('send_offer_sdp', obj)
  })

  // Sender send answer SDP
  socket.on('send_answer_sdp', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] send_answer_sdp')
    const [toSocket] = await getSocketID(obj.to)
    toSocket && io.to(toSocket).emit('send_answer_sdp', obj)
  })

  // お互いに交換
  socket.on('send_found_candidate', async (obj) => {
    const [toSocket] = await getSocketID(obj.to)
    console.log('(socket)[' + lib.showTime() + '] find: from ' + obj.selfType + ' to ' + obj.to)
    toSocket && io.to(toSocket).emit('send_found_candidate', obj)
  })

  // 接続解除
  socket.on('disconnecting', (reason) => {
    statusDB.findOne({ socketid: socket.id }, (err, status) => {
      if (err) return console.log('database error: findOneエラー')
      if (!status) return console.log(socket.id + ' not found')
      statusDB.remove({ socketid: socket.id }, { multi: false }, (err, numRemoved) => {
        if (err || !numRemoved) return console.log('database error: removeエラー')
        console.log('(socket)[' + lib.showTime() + '] disconnect complete: ' + socket.id, reason)
      })
    })
  })
})

const PORT_NUMBER = 3003
server.listen(PORT_NUMBER)
