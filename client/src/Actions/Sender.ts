// import socketio from 'socket.io-client'

import { randomString, stringToBuffer } from '../Library/Library'

import { sendDataChannel, dataChannelBufferedAmount } from './Connection'

import type { Dispatch } from 'redux'
import type { GetState } from '../Types/Store'
import type { SendFileInfo } from '../Types/FileInfo'

export const ACTION_TYPE = {
  setSendFileList: 'SENDER_SET_SEND_FILE_LIST',
} as const

export type Actions = ReturnType<typeof setSendFileList>

// 定数
// ファイルIDは16文字
let idLength = 16
// 終了フラグサイズ
let flagLength = 1
// 1つのpacketは16KB以下にする
let packetSize = 1024 * 16 - flagLength - idLength

function updateSendFileList(
  id: string,
  property: 'preSendInfo' | any,
  value: any,
  dispatch: Dispatch,
  getState: GetState
) {
  const fileList = getState().sender.sendFileList
  const targetFileInfo = fileList.find((fileInfo) => fileInfo.id === id)
  // const targetIndex = fileList.findIndex((fileInfo) => fileInfo.id === id)
  if (!targetFileInfo) return false
  const newTargetFileInfo = {
    ...targetFileInfo,
    [property]: value,
  }
  const newFileList = fileList.map((fileInfo) => {
    return fileInfo.id === targetFileInfo.id ? newTargetFileInfo : fileInfo
  })
  // const newFileList = fileList.splice(targetIndex, 1, targetFileInfo)

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

        // Sender用プロパティ(変更不可)
        // 読み込み状態
        load: false,
        // receiverへfileInfo送信フラグ
        preSendInfo: false,
        // ファイル送信フラグ
        send: null,
        // packet追加用
        idBuffer: stringToBuffer(id),
        // packetCount
        sendPacketCount: 0,
        // 送受信処理終了フラグ
        receiveComplete: false,
        // 送受信結果
        receiveResult: false,

        // Receiver用プロパティ
        receive: false, // (ファイルリスト送信時に追加する)
        preReceiveInfo: false, // (ファイルリスト送信時に追加する)
        receivePacketCount: 0, // (ファイルリスト送信時に追加する)

        // ファイルサイズ情報
        // @ts-ignore
        byteLength: fileList[num].size,
        // @ts-ignore
        sendTime: Math.ceil(fileList[num].size / packetSize),
        // @ts-ignore
        rest: fileList[num].size % packetSize,

        // ファイル情報
        // @ts-ignore
        lastModified: fileList[num].lastModified,
        // @ts-ignore
        name: fileList[num].name,
        // @ts-ignore
        size: fileList[num].size,
        // @ts-ignore
        type: fileList[num].type,
        // @ts-ignore
        webkitRelativePath: fileList[num].webkitRelativePath,

        // file object (FileReaderで利用)
        // 送信直前に開くのでここではファイルにアクセスしない
        file: fileList[num],
      }
    })

    dispatch(setSendFileList([...getState().sender.sendFileList, ...newFileList]))
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
    const sendFileList = getState().sender.sendFileList
    sendFileList.forEach((each: SendFileInfo, num: number) => {
      // Receiverに不要な情報を取り除く
      const { load, preSendInfo, send, sendPacketCount, idBuffer, file, ...attr } = each
      if (!preSendInfo) {
        const sendFileInfo = {
          to: 'receiver',
          add: {
            file: {
              ...attr,
              order: num,
              receive: false,
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
  // return sliceOpenSendFile(id, sendFileList[id], dispatch, getState)
}

// // ファイルを分割して読み込む
// function sliceOpenSendFile (id, fileInfo, dispatch, getState) {
//   // console.time('sendFileTotal' + id)

//   const file = fileInfo.file

//   // file.sizeとbyteLengthは同じっぽい(ファイル追加時に取得している)
//   // updateSendFileList(id, 'byteLength', fileInfo.size, dispatch, getState)
//   // updateSendFileList(id, 'sendTime', Math.ceil(fileInfo.size / packetSize), dispatch, getState)
//   // updateSendFileList(id, 'rest', fileInfo.size % packetSize, dispatch, getState)
//   const startFileInfo = {
//     to: 'receiver',
//     start: {
//       id: id
//     }
//   }
//   // console.log('ファイル送信準備')
//   // console.time('sendFile(' + id + ')')
//   sendDataChannel(JSON.stringify(startFileInfo))

//   let start = 0
//   let sendPacketCount = 0

//   function openSend () {
//     if (getState().sender.sendFileList[id].delete) {
//       // console.log('削除されたため中断', id)
//       return
//     }
//     if (!(start < file.size)) {
//       const endFileInfo = {
//         to: 'receiver',
//         end: {
//           id,
//         }
//       }
//       sendDataChannel(JSON.stringify(endFileInfo))
//       updateSendFileList(id, 'send', 100, dispatch, getState)
//       // console.timeEnd('sendFile(' + id + ')')
//       // console.log('ファイル送信完了')
//       return
//     }
//     let end = start + packetSize
//     const fs = new FileReader()
//     fs.onloadend = (event) => {
//       if (event.target.readyState == FileReader.DONE) {
//         // 送信するpacketの準備
//         let packetData = event.target.result
//         let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
//         packet[0] = (end >= file.size ? 1 : 0)
//         packet.set(fileInfo.idBuffer, flagLength)
//         packet.set(new Uint8Array(packetData), flagLength + idLength)
//         // Chrome待機用(不要になったかも)
//         while (dataChannelBufferedAmount() > 0) {}
//         // 送信および状態更新
//         sendDataChannel(packet)
//         updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)
//         updateSendFileList(id, 'sendPacketCount', sendPacketCount+1, dispatch, getState)
//         sendPacketCount++
//         start = end
//         // console.log('データ送信中')
//         setTimeout(openSend())
//       }
//     }
//     let blob = file.webkitSlice ? file.webkitSlice(start, end) : (file.mozSlice ? file.mozSlice(start, end) : file.slice(start, end))
//     fs.readAsArrayBuffer(blob)
//   }
//   openSend()
// }

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

    // @ts-ignore
    let data = new Uint8Array(event.target.result)
    updateSendFileList(id, 'byteLength', data.byteLength, dispatch, getState)
    updateSendFileList(id, 'sendTime', Math.ceil(data.byteLength / packetSize), dispatch, getState)
    updateSendFileList(id, 'rest', data.byteLength % packetSize, dispatch, getState)
    const startFileInfo = {
      start: {
        to: 'receiver',
        id,
        size: {
          byteLength: data.byteLength,
          sendTime: Math.ceil(data.byteLength / packetSize),
          rest: data.byteLength % packetSize,
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
        let end = start + packetSize
        let packetData = data.slice(start, end)
        let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
        packet[0] = end >= data.byteLength ? 1 : 0
        packet.set(fileInfo.idBuffer, flagLength)
        packet.set(new Uint8Array(packetData), flagLength + idLength)

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
