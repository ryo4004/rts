import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import statusReducer from '../Reducers/Status'
// import socketReducer from '../Reducers/Socket'
import connectionReducer from '../Reducers/Connection'
import senderReducer from '../Reducers/Sender'
import receiverReducer from '../Reducers/Receiver'
// import toastReducer from '../Reducers/Toast'

import type { History } from 'history'

import type { StatusState } from '../Reducers/Status'
import type { ConnectionState } from '../Reducers/Connection'
import type { SenderState } from '../Reducers/Sender'
import type { ReceiverState } from '../Reducers/Receiver'

export interface State {
  status: StatusState
  connection: ConnectionState
  sender: SenderState
  receiver: ReceiverState
}

// historyはsrc/App.jsから渡す
export default function createRootReducer(history: History) {
  return combineReducers({
    status: statusReducer,
    // socket: socketReducer,
    connection: connectionReducer,
    sender: senderReducer,
    receiver: receiverReducer,
    // toast: toastReducer,

    // connected-react-routerのReducer
    router: connectRouter(history),
    // history: historyReducer
  })
}
