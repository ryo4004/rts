import { push } from 'react-router-redux'

import { divisionWidth } from '../Library/Library'

import type { Dispatch } from 'redux'

export const ACTION_TYPE = {
  loading: 'STATUS_LOADING',
  setWidth: 'STATUS_WINDOW_WIDTH',
  setFileAPI: 'STATUS_SET_FILE_API',
  setAvailable: 'STATUS_SET_AVAILABLE',
} as const

export type Actions = ReturnType<typeof loading | typeof setWidth | typeof setFileAPI | typeof setAvailable>

const loading = (loading: boolean) => ({
  type: ACTION_TYPE.loading,
  payload: { loading },
})

export const windowWidthChange = () => {
  return (dispatch: Dispatch) => {
    const width = window.innerWidth
    const pc = width > divisionWidth ? true : false
    const mobile = !pc
    dispatch(setWidth(width, pc, mobile))
  }
}

export const setWidth = (width: number, pc: boolean, mobile: boolean) => ({
  type: ACTION_TYPE.setWidth,
  payload: {
    width,
    pc,
    mobile,
  },
})

export const prepare = () => {
  return async (dispatch: Dispatch) => {
    dispatch(loading(true))
    dispatch(setAvailable(false))
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      dispatch(setFileAPI(true))
    } else {
      dispatch(setFileAPI(false))
    }
    // if (socket.connected && fileAPI) dispatch(setAvailable(true))
    dispatch(loading(false))
  }
}

const setFileAPI = (fileAPI: boolean) => ({
  type: ACTION_TYPE.setFileAPI,
  payload: { fileAPI },
})

const setAvailable = (available: boolean) => ({
  type: ACTION_TYPE.setAvailable,
  payload: { available },
})

export const openGuest = (location: string) => {
  return (dispatch: Dispatch) => {
    dispatch(push(location))
  }
}
