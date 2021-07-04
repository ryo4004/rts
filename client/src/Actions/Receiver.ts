import { ID_LENGTH, FLAG_LENGTH, bufferToString } from '../Library/Library'
import { sendDataChannel } from './Connection'

import type { Dispatch } from 'redux'
import type { GetState } from '../Types/Store'
import type { ReceiveFileInfo } from '../Types/FileInfo'
import type { ReceiveFileStorage } from '../Types/FileStorage'
import type { ReceiveFileUrl } from '../Types/FileUrl'

export const ACTION_TYPE = {
  receiverError: 'RECEIVER_SET_RECEIVE_ERROR',
  setReceiveFileList: 'RECEIVER_SET_RECEIVE_FILE_LIST',
  setReceiveFileUrlList: 'RECEIVER_SET_RECEIVE_FILE_URL_LIST',
  setReceiveFileStorage: 'RECEIVER_SET_RECEIVE_FILE_STORAGE',
} as const

export type Actions = ReturnType<
  typeof receiverError | typeof setReceiveFileList | typeof setReceiveFileUrlList | typeof setReceiveFileStorage
>

export const receiverError = (errorTextClient: any, errorTextServer: any) => ({
  type: ACTION_TYPE.receiverError,
  payload: {
    errorState: true,
    errorText: errorTextClient + ' ' + errorTextServer,
  },
})

const setReceiveFileList = (receiveFileList: Array<ReceiveFileInfo>) => ({
  type: ACTION_TYPE.setReceiveFileList,
  payload: { receiveFileList },
})

function updateReceiveFileList(
  id: string,
  property: keyof ReceiveFileInfo,
  value: any,
  dispatch: Dispatch,
  getState: GetState
) {
  const fileList = getState().receiver.receiveFileList
  const targetFileInfo = fileList.find((fileInfo) => fileInfo.id === id)
  if (!targetFileInfo) return false
  const newTargetFileInfo = { ...targetFileInfo, [property]: value }
  const newFileList = fileList.map((fileInfo) => {
    return fileInfo.id === targetFileInfo.id ? newTargetFileInfo : fileInfo
  })
  dispatch(setReceiveFileList(newFileList))
}

function resetReceiveFileStorage(id: string, dispatch: Dispatch, getState: GetState) {
  const receiveFileStorage = getState().receiver.receiveFileStorage
  const newReceiveFileStorage = receiveFileStorage.map((fileStorage) => {
    return fileStorage.id === id ? { id, packets: [] } : fileStorage
  })
  dispatch(setReceiveFileStorage(newReceiveFileStorage))
}

function updateReceiveFileStorage(id: string, value: Uint8Array, dispatch: Dispatch, getState: GetState) {
  const receiveFileStorage = getState().receiver.receiveFileStorage
  const targetFileStorage = receiveFileStorage.find((fileStorage) => fileStorage.id === id)
  if (!targetFileStorage) {
    dispatch(setReceiveFileStorage([...receiveFileStorage, { id, packets: [value] }]))
  } else {
    const newReceiveFileStorage = receiveFileStorage.map((fileStorage) => {
      if (fileStorage.id === id) {
        return {
          ...targetFileStorage,
          packets: [...targetFileStorage.packets, value],
        }
      }
      return fileStorage
    })
    dispatch(setReceiveFileStorage(newReceiveFileStorage))
  }
}

function createReceiveFile(id: string, dispatch: Dispatch, getState: GetState) {
  const receiveFileInfo = getState().receiver.receiveFileList.find((fileInfo) => fileInfo.id === id)
  const receiveFileStorage = getState().receiver.receiveFileStorage.find((fileStorage) => fileStorage.id === id)
  if (!receiveFileInfo || !receiveFileStorage) return false
  const packets = receiveFileStorage.packets

  const receiveResult = receiveFileInfo.receivePacketCount === receiveFileInfo.sendTime ? true : false
  updateReceiveFileList(id, 'receiveComplete', true, dispatch, getState)
  updateReceiveFileList(id, 'receiveResult', receiveResult, dispatch, getState)

  // 受信完了通知を送る
  let receiveComplete = {
    to: 'sender',
    receiveComplete: {
      id: id,
      result: receiveResult,
    },
  }
  sendDataChannel(JSON.stringify(receiveComplete))

  let fileArray: any = []

  packets.forEach((packet: any, i: number) => {
    fileArray.push(packet.slice(FLAG_LENGTH + ID_LENGTH))
  })

  const file = new File(fileArray, receiveFileInfo.name, {
    type: receiveFileInfo.type,
    lastModified: receiveFileInfo.lastModified,
  })

  const receiveFileUriList = getState().receiver.receiveFileUrlList
  const newReceiveFileUrl = { id, url: window.URL.createObjectURL(file) }
  dispatch(setReceiveFileUrlList([...receiveFileUriList, newReceiveFileUrl]))

  // 受信データ一時置き場をリセットする
  resetReceiveFileStorage(id, dispatch, getState)
  // console.timeEnd('receiveTotal' + id)
}

// データ受信
export function receiverReceiveData(event: any, dispatch: Dispatch, getState: GetState) {
  if (typeof event.data === 'string') {
    // オブジェクトのプロパティによって処理判定
    if (JSON.parse(event.data).add !== undefined) {
      // 受信ファイル一覧を取得
      // addプロパティを外す
      const receiveFile = JSON.parse(event.data).add
      const receiveFileInfo = receiveFile.file
      // console.log('受信ファイルリストに追加')
      dispatch(setReceiveFileList([...getState().receiver.receiveFileList, receiveFileInfo]))
      return false
    } else if (JSON.parse(event.data).delete !== undefined) {
      // ファイル削除通知
      // deleteプロパティを外す
      const deleteReceive = JSON.parse(event.data).delete
      updateReceiveFileList(deleteReceive.id, 'delete', true, dispatch, getState)
      resetReceiveFileStorage(deleteReceive.id, dispatch, getState)
      return false
    } else if (JSON.parse(event.data).err !== undefined) {
      // ファイルエラー通知
      // errプロパティを外す
      const errReceive = JSON.parse(event.data).err
      updateReceiveFileList(errReceive.id, 'err', true, dispatch, getState)
      resetReceiveFileStorage(errReceive.id, dispatch, getState)
      return false
    } else if (JSON.parse(event.data).start !== undefined) {
      // ファイル受信開始
      // startプロパティを外す
      const startReceive = JSON.parse(event.data).start
      // console.time('receiveTotal' + startReceive.id)
      // console.time('receiveFile' + startReceive.id)
      // console.log('ファイル受信開始')
      resetReceiveFileStorage(startReceive.id, dispatch, getState)
      // これはもう受信済み
      // updateReceiveFileList(startReceive.id, 'byteLength', startReceive.size.byteLength, dispatch, getState)
      // updateReceiveFileList(startReceive.id, 'rest', startReceive.size.rest, dispatch, getState)
      // updateReceiveFileList(startReceive.id, 'sendTime', startReceive.size.sendTime, dispatch, getState)
      updateReceiveFileList(startReceive.id, 'preReceiveInfo', true, dispatch, getState)

      // receiveFileInfoは上書き
      return false // dispatch(setReceiveFileInfo(receiveData))
    } else if (JSON.parse(event.data).end !== undefined) {
      // ファイル受信完了
      // endプロパティを外す
      const endReceive = JSON.parse(event.data).end
      // console.timeEnd('receiveFile' + endReceive.id)
      // console.log('ファイル受信完了')
      createReceiveFile(endReceive.id, dispatch, getState)
      updateReceiveFileList(endReceive.id, 'receive', 100, dispatch, getState)
      return false
    }
  }
  // ファイル本体受信
  const receiveData = new Uint8Array(event.data)
  const id = bufferToString(receiveData.slice(FLAG_LENGTH, FLAG_LENGTH + ID_LENGTH))
  const receiveFileList = getState().receiver.receiveFileList
  const receiveFileInfo = receiveFileList.find((fileInfo) => fileInfo.id === id)
  if (!receiveFileInfo) return false
  updateReceiveFileStorage(id, receiveData, dispatch, getState)
  updateReceiveFileList(id, 'receivePacketCount', receiveFileInfo.receivePacketCount + 1, dispatch, getState)
  updateReceiveFileList(
    id,
    'receive',
    Math.ceil((receiveFileInfo.receivePacketCount / receiveFileInfo.sendTime) * 1000.0) / 10.0,
    dispatch,
    getState
  )
  // console.log('データ受信中')
  return false
}

const setReceiveFileUrlList = (receiveFileUrlList: Array<ReceiveFileUrl>) => ({
  type: ACTION_TYPE.setReceiveFileUrlList,
  payload: { receiveFileUrlList },
})

const setReceiveFileStorage = (receiveFileStorage: Array<ReceiveFileStorage>) => ({
  type: ACTION_TYPE.setReceiveFileStorage,
  payload: { receiveFileStorage },
})
