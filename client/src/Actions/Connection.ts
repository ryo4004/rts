import { io } from 'socket.io-client'

import { senderReceiveData, dataChannelOnOpen } from './Sender'

import { receiverReceiveData, receiverError } from './Receiver'

import type { Dispatch } from 'redux'
import type { Socket } from 'socket.io-client'

let peerConnection: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null

// Usermodeによってイベント処理を分ける
// dataChannel.onmessage => sender, receiver

export const ACTION_TYPE = {
  loading: 'CONNECTION_LOADING',
  setSocket: 'CONNECTION_SET_SOCKET',
  setSelfSocketID: 'CONNECTION_SET_SELF_SOCKET_ID',
  setSenderSocketID: 'CONNECTION_SET_SENDER_SOCKET_ID',
  setReceiverSocketID: 'CONNECTION_SET_RECEIVER_SOCKET_ID',
  dataChannelOpenStatus: 'CONNECTION_DATACHANNEL_OPEN_STATUS',
} as const

export type Actions = ReturnType<
  | typeof loading
  | typeof setSocket
  | typeof setSelfSocketID
  | typeof setSenderSocketID
  | typeof setReceiverSocketID
  | typeof dataChannelOpenStatus
>

type LoadingAction = {
  type: typeof ACTION_TYPE.loading
  payload: { loading: boolean }
}
const loading = (loading: boolean): LoadingAction => ({
  type: ACTION_TYPE.loading,
  payload: { loading },
})

type SetSocketAction = {
  type: typeof ACTION_TYPE.setSocket
  payload: { socket: any }
}
const setSocket = (socket: any): SetSocketAction => ({
  type: ACTION_TYPE.setSocket,
  payload: { socket },
})

type SetSelfSocketID = {
  type: typeof ACTION_TYPE.setSelfSocketID
  payload: { selfSocketID: string }
}
const setSelfSocketID = (selfSocketID: string): SetSelfSocketID => ({
  type: ACTION_TYPE.setSelfSocketID,
  payload: { selfSocketID },
})

type SetSenderSocketID = {
  type: typeof ACTION_TYPE.setSenderSocketID
  payload: { senderSocketID: string }
}
const setSenderSocketID = (senderSocketID: string): SetSenderSocketID => ({
  type: ACTION_TYPE.setSenderSocketID,
  payload: { senderSocketID },
})

type SetReceiverSocketID = {
  type: typeof ACTION_TYPE.setReceiverSocketID
  payload: { receiverSocketID: string }
}
const setReceiverSocketID = (receiverSocketID: string): SetReceiverSocketID => ({
  type: ACTION_TYPE.setReceiverSocketID,
  payload: { receiverSocketID },
})

type DataChannelOpenStatus = {
  type: typeof ACTION_TYPE.dataChannelOpenStatus
  payload: { dataChannelOpenStatus: any }
}
const dataChannelOpenStatus = (dataChannelOpenStatus: any): DataChannelOpenStatus => ({
  type: ACTION_TYPE.dataChannelOpenStatus,
  payload: { dataChannelOpenStatus },
})

// Sender Connection Start
export const senderConnect = () => {
  return async (dispatch: Dispatch, getState: any) => {
    dispatch(loading(true))
    // Socket接続
    const socket = io('https://' + window.location.host + '/', { secure: true })
    socket.on('connect', () => {
      dispatch(setSocket(socket))
    })
    // 受信 connection_complete で自分のIDを取得
    socket.on('connection_complete', (obj: any) => {
      dispatch(loading(false))
      dispatch(setSelfSocketID(obj.id))
    })
    // 受信 Receiver情報を取得
    socket.on('request_to_sender', (obj: any) => {
      dispatch(setReceiverSocketID(obj.from))
    })
    // 受信
    socket.on('send_offer_sdp', async (obj: any) => {
      // PeerConnection作成
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        iceTransportPolicy: 'all',
      })
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel
        dataChannel.onopen = () => {
          socket.disconnect()
          // console.log('DataChannel onopen')
          dispatch(dataChannelOpenStatus(true))
          // 未送信のファイルリストを確認して送信
          dataChannelOnOpen(dispatch, getState)
        }
        dataChannel.onclose = () => {
          dispatch(dataChannelOpenStatus(false))
          // console.log('DataChannel onclose')
        }
        dataChannel.onerror = () => {
          dispatch(dataChannelOpenStatus(false))
          // console.log('DataChannel onerror')
        }
        // 受信データ形式を明示(ブラウザ間差異のため)
        dataChannel.binaryType = 'arraybuffer'
        dataChannel.onmessage = (event) => {
          receiveDataChannel(event, dispatch, getState)
        }
      }
      peerConnection.oniceconnectionstatechange = (event) => {
        // console.log('oniceconnectionstatechange', event, peerConnection.iceConnectionState)
        if (!peerConnection) return false
        switch (peerConnection.iceConnectionState) {
          case 'new':
            // console.log('peerConnection new')
            break
          case 'checking':
            // console.log('peerConnection checking')
            break
          case 'connected':
            // console.log('peerConnection connected')
            break
          case 'completed':
            // console.log('peerConnection completed')
            break
          case 'closed':
            if (dataChannel) {
              // console.log('dataChannel close request')
              dataChannel.close()
              dispatch(dataChannelOpenStatus(false))
            }
            // console.log('peerConnection closed', dataChannel.readyState)
            break
          case 'failed':
            if (dataChannel) {
              // console.log('dataChannel close request')
              dataChannel.close()
              dispatch(dataChannelOpenStatus(false))
            }
            // console.log('peerConnection failed', dataChannel.readyState)
            break
          case 'disconnected':
            if (dataChannel) {
              // console.log('dataChannel close request')
              dataChannel.close()
              dispatch(dataChannelOpenStatus(false))
            }
            // console.log('peerConnection disconnected', dataChannel.readyState)
            break
          default:
          // console.log('peerConnection default', peerConnection.iceConnectionState)
        }
      }
      peerConnection.onicegatheringstatechange = (event) => {
        // console.log('onicegatheringstatechange', event, peerConnection.iceConnectionState)
      }
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // console.log('onicecandidate')
          getState().connection.socket.emit('send_found_candidate', {
            selfType: 'Sender',
            to: getState().connection.receiverSocketID,
            from: getState().connection.selfSocketID,
            candidate: event.candidate,
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(obj.sdp))
      let answerSdp = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answerSdp)
      socket.emit('send_answer_sdp', {
        to: getState().connection.receiverSocketID,
        type: 'answer',
        sdp: answerSdp,
      })
    })
    socket.on('send_found_candidate', async (obj: any) => {
      // console.log('onicecandidate found')
      if (!peerConnection) return false
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
  }
}
// Sender Connection End

// Receiver Connection Start
export const receiverConnect = (senderSocketID: string) => {
  return async (dispatch: Dispatch, getState: any) => {
    dispatch(loading(true))
    dispatch(setSenderSocketID(senderSocketID))
    // Socket接続
    const socket: Socket = io('https://' + window.location.host + '/', { secure: true })
    // const socket = socketio.connect('https://rts.zatsuzen.com', {secure: true})
    socket.on('connect', () => {
      dispatch(setSocket(socket))
    })
    // connection_complete で自分のIDを取得
    socket.on('connection_complete', async (obj) => {
      dispatch(loading(false))
      dispatch(setSelfSocketID(obj.id))
      // senderにRequestを送る(IDを通知)
      socket.emit('request_to_sender', {
        from: obj.id,
        to: senderSocketID,
      })
      // request_to_senderに対するエラー(相手が見つからない)
      socket.on('request_to_sender_error', (obj) => {
        // console.error('request_to_sender_error', obj.error)
        dispatch(receiverError('request_to_sender_error', obj.error))
      })

      // peerConnectionを作成
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        iceTransportPolicy: 'all',
      })
      dataChannel = peerConnection.createDataChannel('dataChannel', {
        ordered: true,
      })
      dataChannel.onopen = () => {
        socket.disconnect()
        dispatch(dataChannelOpenStatus(true))
        // console.log('DataChannel onopen')
      }
      dataChannel.onclose = () => {
        dispatch(dataChannelOpenStatus(false))
        // console.log('DataChannel onclose')
      }
      dataChannel.onerror = () => {
        dispatch(dataChannelOpenStatus(false))
        // console.log('DataChannel onerror')
      }
      // 受信データ形式を明示(ブラウザ間差異のため)
      dataChannel.binaryType = 'arraybuffer'
      // 受信時の処理
      dataChannel.onmessage = (event) => {
        receiveDataChannel(event, dispatch, getState)
      }
      peerConnection.oniceconnectionstatechange = (event) => {
        // console.log('oniceconnectionstatechange', event, peerConnection.iceConnectionState)
        if (!peerConnection) return false
        switch (peerConnection.iceConnectionState) {
          case 'new':
            // console.log('peerConnection new')
            break
          case 'checking':
            // console.log('peerConnection checking')
            break
          case 'connected':
            // console.log('peerConnection connected')
            break
          case 'completed':
            // console.log('peerConnection completed')
            break
          case 'closed':
            if (dataChannel) {
              // console.log('dataChannel close request')
              dataChannel.close()
              dispatch(dataChannelOpenStatus(false))
            }
            // console.log('peerConnection closed', dataChannel.readyState)
            break
          case 'failed':
            if (dataChannel) {
              // console.log('dataChannel close request')
              dataChannel.close()
              dispatch(dataChannelOpenStatus(false))
            }
            // console.log('peerConnection failed', dataChannel.readyState)
            break
          case 'disconnected':
            if (dataChannel) {
              // console.log('dataChannel close request')
              dataChannel.close()
              dispatch(dataChannelOpenStatus(false))
            }
            // console.log('peerConnection disconnected', dataChannel.readyState)
            break
          default:
          // console.log('peerConnection default', peerConnection.iceConnectionState)
        }
      }
      peerConnection.onicegatheringstatechange = (event) => {
        // console.log('onicegatheringstatechange', event, peerConnection.iceConnectionState)
      }
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // console.log('onicecandidate')
          socket.emit('send_found_candidate', {
            selfType: 'Receiver',
            to: senderSocketID,
            from: obj.id,
            candidate: event.candidate,
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }

      // console.log('label', dataChannel.label)
      // console.log('ordered', dataChannel.ordered)
      // console.log('protocol', dataChannel.protocol)
      // console.log('id', dataChannel.id)
      // console.log('readyState', dataChannel.readyState)
      // console.log('bufferedAmount', dataChannel.bufferedAmount)
      // console.log('binaryType', dataChannel.binaryType)
      // console.log('maxPacketLifeType', dataChannel.maxPacketLifeType)
      // console.log('maxRetransmits', dataChannel.maxRetransmits)
      // console.log('negotiated', dataChannel.negotiated)
      // console.log('reliable', dataChannel.reliable)
      // console.log('stream', dataChannel.stream)

      let offerSdp = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offerSdp)

      // senderにRequestを送る
      socket.emit('send_offer_sdp', {
        to: senderSocketID,
        type: 'offer',
        sdp: offerSdp,
      })
    })
    // 受信
    socket.on('send_answer_sdp', async (obj) => {
      if (!peerConnection) return false
      await peerConnection.setRemoteDescription(new RTCSessionDescription(obj.sdp))
    })
    // 受信
    socket.on('send_found_candidate', async (obj) => {
      // console.log('onicecandidate found')
      if (!peerConnection) return false
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
    dispatch(setSocket(socket))
  }
}
// Receiver Connection End

export const disconnect = () => {
  return async () => {
    if (peerConnection) {
      if (peerConnection.iceConnectionState !== 'closed') {
        peerConnection.close()
        peerConnection = null
      }
    }
  }
}

export const dataChannelBufferedAmount = () => {
  return dataChannel && dataChannel.bufferedAmount
}

export const sendDataChannel = (data: any) => {
  dataChannel && dataChannel.send(data)
  // if (dataChannel.readyState === 'open') {
  //   dataChannel.send(data)
  //   return true
  // }
  // return false
}

export const receiveDataChannel = (event: any, dispatch: Dispatch, getState: any) => {
  if (typeof event.data === 'string') {
    if (JSON.parse(event.data).to === 'sender') {
      return senderReceiveData(event, dispatch, getState)
    }
  }
  receiverReceiveData(event, dispatch, getState)
}
