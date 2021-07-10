import { store } from '../App'

export type GetState = typeof store.getState
export type RootState = ReturnType<typeof store.getState>
