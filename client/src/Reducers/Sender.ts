import { ACTION_TYPE } from '../Actions/Sender'
import type { Actions } from '../Actions/Sender'

import type { FileInfo } from '../Types/FileInfo'

export type SenderState = {
  loading: boolean

  sendFileList: Array<FileInfo>
  sendFileStorage: object // 使用しているか確認する
}

const initialState: SenderState = {
  loading: false,

  // 追加されたファイルと状態の管理
  sendFileList: [],
  sendFileStorage: {},
}

export default function senderReducer(state = initialState, action: Actions): SenderState {
  switch (action.type) {
    case ACTION_TYPE.setSendFileList:
      return {
        ...state,
        sendFileList: action.payload.sendFileList,
      }
    default:
      return state
  }
}
