import { ACTION_TYPE } from '../Actions/Connection'
import type { Actions } from '../Actions/Connection'

export type ConnectionState = {
  loading: boolean

  socket: any | null
  selfSocketID: string | null
  senderSocketID: string | null
  receiverSocketID: string | null

  dataChannelOpenStatus: boolean
}

const initialState: ConnectionState = {
  loading: false,

  socket: null,
  selfSocketID: null,
  senderSocketID: null,
  receiverSocketID: null,

  dataChannelOpenStatus: false,
}

export default function connectionReducer(state = initialState, action: Actions): ConnectionState {
  switch (action.type) {
    case ACTION_TYPE.loading:
      return {
        ...state,
        loading: action.payload.loading,
      }
    case ACTION_TYPE.setSocket:
      return {
        ...state,
        socket: action.payload.socket,
      }
    case ACTION_TYPE.setSelfSocketID:
      return {
        ...state,
        selfSocketID: action.payload.selfSocketID,
      }
    case ACTION_TYPE.setSenderSocketID:
      return {
        ...state,
        senderSocketID: action.payload.senderSocketID,
      }
    case ACTION_TYPE.setReceiverSocketID:
      return {
        ...state,
        receiverSocketID: action.payload.receiverSocketID,
      }
    case ACTION_TYPE.dataChannelOpenStatus:
      return {
        ...state,
        dataChannelOpenStatus: action.payload.dataChannelOpenStatus,
      }
    default:
      return state
  }
}
