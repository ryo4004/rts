import { ACTION_TYPE } from '../Actions/Sender'
import type { Actions } from '../Actions/Sender'

export type SenderState = {
  loading: boolean

  fileList: object // 使用しているか確認する
  sendFileList: object
  sendFileStorage: object // 使用しているか確認する
}

const initialState: SenderState = {
  loading: false,

  // 追加されたファイルと状態の管理
  sendFileList: {},

  fileList: {},
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
