import { ID_LENGTH, FLAG_LENGTH, PACKET_SIZE, randomString, stringToBuffer } from '../Library/Library'
import { sendDataChannel, dataChannelBufferedAmount } from './Connection'

import type { Dispatch } from 'redux'
import type { GetState } from '../Types/Store'
import type { SendFileInfo, ReceiveFileInfo } from '../Types/FileInfo'

export const ACTION_TYPE = {
  senderError: 'SENDER_SET_SENDER_ERROR',
  setSendFileList: 'SENDER_SET_SEND_FILE_LIST',
} as const

export type Actions = ReturnType<typeof setSendFileList | typeof senderError>

export const senderError = (errorTextClient: any, errorTextServer: any) => ({
  type: ACTION_TYPE.senderError,
  payload: {
    errorState: true,
    errorText: errorTextClient + ' ' + errorTextServer,
  },
})

function updateSendFileList(
  id: string,
  property: keyof SendFileInfo,
  value: any,
  dispatch: Dispatch,
  getState: GetState
) {
  const fileList = getState().sender.sendFileList
  const targetFileInfo = fileList.find((fileInfo) => fileInfo.id === id)
  if (!targetFileInfo) return false
  const newTargetFileInfo = { ...targetFileInfo, [property]: value }
  const newFileList = fileList.map((fileInfo) => {
    return fileInfo.id === targetFileInfo.id ? newTargetFileInfo : fileInfo
  })
  dispatch(setSendFileList(newFileList))
}

export const addFile = (fileList: FileList | null) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (fileList === null) return false
    const newFileList = [...Array(fileList.length)].map((_, num) => {
      const id = randomString()
      return {
        id,
        timestamp: new Date().getTime(),
        add: true,
        delete: false,
        err: false,
        load: false,
        preSendInfo: false,
        send: null,
        idBuffer: stringToBuffer(id),
        sendPacketCount: 0,
        receiveComplete: false,
        receiveResult: false,
        byteLength: fileList[num].size,
        sendTime: Math.ceil(fileList[num].size / PACKET_SIZE),
        rest: fileList[num].size % PACKET_SIZE,
        lastModified: fileList[num].lastModified,
        name: fileList[num].name,
        size: fileList[num].size,
        type: fileList[num].type,
        file: fileList[num],
      }
    })

    dispatch(setSendFileList([...newFileList, ...getState().sender.sendFileList]))
    sendFileListOnDataChannel(dispatch, getState)
  }
}

// 追加したファイルを1つ削除
export const deleteFile = (id: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const deleteFileInfo = getState().sender.sendFileList.find((fileInfo) => fileInfo.id === id)
    if (!deleteFileInfo) return false
    // preSendInfoを送信済みの場合はReceiverに削除を通知する
    if (deleteFileInfo.preSendInfo === true) {
      const deleteFileInfo = {
        to: 'receiver',
        delete: { id },
      }
      sendDataChannel(JSON.stringify(deleteFileInfo))
    }
    updateSendFileList(id, 'delete', true, dispatch, getState)
  }
}

export const errorFile = (id: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const errorFileInfo = getState().sender.sendFileList.find((fileInfo) => fileInfo.id === id)
    if (!errorFileInfo) return false
    // preSendInfoを送信済みの場合はReceiverに削除を通知する
    if (errorFileInfo.preSendInfo === true) {
      const errorFileInfo = {
        to: 'receiver',
        err: { id },
      }
      sendDataChannel(JSON.stringify(errorFileInfo))
    }
    updateSendFileList(id, 'err', true, dispatch, getState)
  }
}

export const dataChannelOnOpen = (dispatch: Dispatch, getState: GetState) => {
  sendFileListOnDataChannel(dispatch, getState)
  return false
}

function sendFileListOnDataChannel(dispatch: Dispatch, getState: GetState) {
  if (getState().connection.dataChannelOpenStatus) {
    getState()
      .sender.sendFileList.map((fileInfo) => fileInfo) // 別の配列にする
      .reverse()
      .forEach((each: SendFileInfo, num: number) => {
        // Receiverに不要な情報を取り除く
        const { load, preSendInfo, send, sendPacketCount, idBuffer, file, ...attr } = each
        if (!preSendInfo) {
          const sendFileInfo: { to: 'receiver'; add: { file: ReceiveFileInfo } } = {
            to: 'receiver',
            add: {
              file: {
                ...attr,
                receive: null,
                preReceiveInfo: false,
                receivePacketCount: 0,
              },
            },
          }
          sendDataChannel(JSON.stringify(sendFileInfo))
          updateSendFileList(each.id, 'preSendInfo', true, dispatch, getState)
        }
      })
  }
}

const setSendFileList = (sendFileList: Array<SendFileInfo>) => ({
  type: ACTION_TYPE.setSendFileList,
  payload: { sendFileList },
})

export function senderReceiveData(event: any, dispatch: Dispatch, getState: GetState) {
  if (typeof event.data === 'string') {
    if (JSON.parse(event.data).receiveComplete !== undefined) {
      const receiveComplete = JSON.parse(event.data).receiveComplete
      // 受信完了通知
      // console.log('受信完了通知', (receiveComplete ? '成功' : '失敗'))
      // console.timeEnd('sendFileTotal' + receiveComplete.id)
      updateSendFileList(receiveComplete.id, 'receiveComplete', true, dispatch, getState)
      updateSendFileList(receiveComplete.id, 'receiveResult', receiveComplete.result, dispatch, getState)
    }
  }
}

export const sendData = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!getState().connection.dataChannelOpenStatus) return false // console.error('Data Channel not open')
    const sendFileList = getState().sender.sendFileList
    if (sendFileList.length === 0) return false // console.error('Send file not found')
    // 未送信ファイルのidのみのリストを作成
    const sendList = sendFileList.filter((fileInfo) => {
      // 送信開始済みと削除済みファイルは除外
      if (fileInfo.send !== null || fileInfo.delete) return false
      return true
    })
    // 未送信ファイルを追加順で送信する
    sendList.forEach((fileInfo) => {
      updateSendFileList(fileInfo.id, 'send', 0, dispatch, getState)
      sendFileData(fileInfo.id, dispatch, getState)
    })
    // if (sendList.length === 0) console.error('送るファイルはありません', sendList)
  }
}

function sendFileData(id: any, dispatch: Dispatch, getState: GetState) {
  // console.log('ファイル送信処理開始', id)

  // ファイル情報を取得
  const sendFileInfo = getState().sender.sendFileList.find((fileInfo) => fileInfo.id === id)

  // 削除されたファイルは何もしない(二重確認)
  if (!sendFileInfo || sendFileInfo.delete) return false

  // 送信方法を選択
  return openSendFile(id, sendFileInfo, dispatch, getState)
}

function openSendFile(id: string, fileInfo: SendFileInfo, dispatch: Dispatch, getState: GetState) {
  if (!getState().connection.dataChannelOpenStatus) {
    return console.error('dataChannel not open')
  }
  // console.time('sendTotal' + id)
  // FileReaderの設定
  let fileReader = new FileReader()
  fileReader.onloadstart = (event) => {
    updateSendFileList(id, 'load', 0, dispatch, getState)
  }
  fileReader.onabort = (event) => {
    console.log('fileReader onabort', event)
  }
  fileReader.onerror = (event) => {
    console.log('fileReader onerror', event)
    // @ts-ignore
    dispatch(errorFile(id))
  }
  fileReader.onloadend = (event) => {
    updateSendFileList(id, 'load', 100, dispatch, getState)
  }
  fileReader.onprogress = (event) => {
    // console.log('load', event.loaded)
    const percent = Math.ceil((event.loaded / event.total) * 1000.0) / 10.0
    updateSendFileList(id, 'load', percent, dispatch, getState)
  }
  fileReader.onload = async (event) => {
    updateSendFileList(id, 'load', 100, dispatch, getState)
    if (!event.target || !event.target.result || typeof event.target.result !== 'object') return false
    const data = new Uint8Array(event.target.result)
    updateSendFileList(id, 'byteLength', data.byteLength, dispatch, getState)
    updateSendFileList(id, 'sendTime', Math.ceil(data.byteLength / PACKET_SIZE), dispatch, getState)
    updateSendFileList(id, 'rest', data.byteLength % PACKET_SIZE, dispatch, getState)
    const startFileInfo = {
      start: {
        to: 'receiver',
        id,
        size: {
          byteLength: data.byteLength,
          sendTime: Math.ceil(data.byteLength / PACKET_SIZE),
          rest: data.byteLength % PACKET_SIZE,
        },
      },
    }
    sendDataChannel(JSON.stringify(startFileInfo))

    let start = 0
    let sendPacketCount = 0

    // 送信処理
    function sendPacket() {
      if (!(start < data.byteLength)) {
        const endFileInfo = {
          to: 'receiver',
          end: { id },
        }
        sendDataChannel(JSON.stringify(endFileInfo))
        updateSendFileList(id, 'send', 100, dispatch, getState)
        return
      }
      if (dataChannelBufferedAmount() === 0) {
        let end = start + PACKET_SIZE
        let packetData = data.slice(start, end)
        let packet = new Uint8Array(packetData.byteLength + FLAG_LENGTH + ID_LENGTH)
        packet[0] = end >= data.byteLength ? 1 : 0
        packet.set(fileInfo.idBuffer, FLAG_LENGTH)
        packet.set(new Uint8Array(packetData), FLAG_LENGTH + ID_LENGTH)

        // 送信および状態更新
        sendDataChannel(packet)
        updateSendFileList(
          id,
          'send',
          Math.ceil((sendPacketCount / fileInfo.sendTime) * 1000.0) / 10.0,
          dispatch,
          getState
        )
        updateSendFileList(id, 'sendPacketCount', sendPacketCount + 1, dispatch, getState)
        sendPacketCount++
        start = end
      }
      setTimeout(sendPacket)
    }
    sendPacket()
  }

  // ファイル読み込み
  fileReader.readAsArrayBuffer(fileInfo.file)
}
