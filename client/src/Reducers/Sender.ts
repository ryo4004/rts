import { ACTION_TYPE } from '../Actions/Sender'
import type { Actions } from '../Actions/Sender'

import type { SendFileInfo } from '../Types/FileInfo'

export type SenderState = {
  loading: boolean

  sendFileList: Array<SendFileInfo>
  sendFileStorage: object // 使用しているか確認する

  errorState: boolean | undefined
  errorText: any | undefined
}

const initialState: SenderState = {
  loading: false,

  // 追加されたファイルと状態の管理
  sendFileList: [],
  sendFileStorage: {},

  errorState: undefined,
  errorText: undefined,
}

export default function senderReducer(state = initialState, action: Actions): SenderState {
  switch (action.type) {
    case ACTION_TYPE.setSendFileList:
      return {
        ...state,
        sendFileList: action.payload.sendFileList,
      }
    case ACTION_TYPE.senderError:
      return {
        ...state,
        errorState: action.payload.errorState,
        errorText: action.payload.errorText,
      }
    default:
      return state
  }
}
