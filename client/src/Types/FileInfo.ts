export type FileInfo = {
  id: string
  timestamp: number
  add: boolean
  delete: boolean
  err: boolean
  load: boolean
  preSendInfo: boolean
  send: number | null
  idBuffer: Uint8Array
  sendPacketCount: number
  receiveComplete: boolean
  receiveResult: boolean
  receive: boolean
  preReceiveInfo: boolean
  receivePacketCount: number
  byteLength: number
  sendTime: number
  rest: number
  lastModified: number
  name: string
  size: number
  type: string
  webkitRelativePath: any
  file: File
}
