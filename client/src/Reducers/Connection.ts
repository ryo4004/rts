import { ACTION_TYPE } from '../Actions/Connection'
import type { Actions } from '../Actions/Connection'

export type ConnectionState = {
  loading: boolean

  socket: string | undefined
  selfSocketID: string | undefined
  senderSocketID: string | undefined
  receiverSocketID: string | undefined

  dataChannelOpenStatus: boolean
}

const initialState: ConnectionState = {
  loading: false,

  socket: undefined,
  selfSocketID: undefined,
  senderSocketID: undefined,
  receiverSocketID: undefined,

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
