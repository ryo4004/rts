import { ACTION_TYPE } from '../Actions/Sender'
import type { Actions } from '../Actions/Sender'

export type SenderState = {
  loading: boolean
  sendFileList: object
}

const initialState: SenderState = {
  loading: false,

  // 追加されたファイルと状態の管理
  sendFileList: {},
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
