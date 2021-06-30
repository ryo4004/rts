import { ACTION_TYPE } from '../Actions/Status'
import type { Actions } from '../Actions/Status'

type StatusState = {
  loading: boolean
  width: number
  pc: boolean
  mobile: boolean

  fileAPI: boolean | undefined
  available: boolean | undefined
}

const initialState: StatusState = {
  loading: false,
  width: 0,
  pc: true,
  mobile: false,

  fileAPI: undefined,
  available: undefined,
}

export default function statusReducer(state = initialState, action: Actions): StatusState {
  switch (action.type) {
    case ACTION_TYPE.loading:
      return {
        ...state,
        loading: action.payload.loading,
      }
    case ACTION_TYPE.setWidth:
      return {
        ...state,
        width: action.payload.width,
        pc: action.payload.pc,
        mobile: action.payload.mobile,
      }
    case ACTION_TYPE.setFileAPI:
      return {
        ...state,
        fileAPI: action.payload.fileAPI,
      }
    case ACTION_TYPE.setAvailable:
      return {
        ...state,
        available: action.payload.available,
      }
    default:
      return state
  }
}
