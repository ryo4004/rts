import { ACTION_TYPE } from '../Actions/Receiver'
import type { Actions } from '../Actions/Receiver'
import type { ReceiveFileInfo } from '../Types/FileInfo'

export type ReceiverState = {
  loading: boolean

  // 追加されたファイルと状態の管理
  receiveFileList: Array<ReceiveFileInfo>
  // ファイル一時置き場
  receiveFileStorage: object

  // ファイルURLリスト
  receiveFileUrlList: object
  // receivedFileUrl: undefined,

  errorState: boolean | undefined
  errorText: any | undefined
}

const initialState: ReceiverState = {
  loading: false,

  // 追加されたファイルと状態の管理
  receiveFileList: [],
  // ファイル一時置き場
  receiveFileStorage: {},

  // ファイルURLリスト
  receiveFileUrlList: {},
  // receivedFileUrl: undefined,

  errorState: undefined,
  errorText: undefined,
}

export default function receiverReducer(state = initialState, action: Actions): ReceiverState {
  switch (action.type) {
    case ACTION_TYPE.setReceiveFileList:
      return {
        ...state,
        receiveFileList: action.payload.receiveFileList,
      }
    case ACTION_TYPE.setReceiveFileStorage:
      return {
        ...state,
        receiveFileStorage: action.payload.receiveFileStorage,
      }
    case ACTION_TYPE.setReceiveFileUrlList:
      return {
        ...state,
        receiveFileUrlList: action.payload.receiveFileUrlList,
      }
    case ACTION_TYPE.receiverError:
      return {
        ...state,
        errorState: action.payload.errorState,
        errorText: action.payload.errorText,
      }
    default:
      return state
  }
}
