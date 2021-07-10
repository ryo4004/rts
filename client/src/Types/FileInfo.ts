type SenderInfo = {
  // Sender用プロパティ
  // 読み込み状態
  load: boolean
  // receiverへfileInfo送信フラグ
  preSendInfo: boolean
  // ファイル送信フラグ
  send: number | null
  // packet追加用
  idBuffer: Uint8Array
  // packetCount
  sendPacketCount: number
  // 送受信処理終了フラグ
  receiveComplete: boolean
  // 送受信結果
  receiveResult: boolean
}

export type SendFileInfo = {
  // 基本情報
  id: string
  timestamp: number
  add: boolean
  delete: boolean
  err: boolean

  // ファイルサイズ情報
  byteLength: number
  sendTime: number
  rest: number

  // ファイル情報
  lastModified: number
  name: string
  size: number
  type: string

  // file object (FileReaderで利用)
  // 送信直前に開くのでここではファイルにアクセスしない
  file: File
} & SenderInfo

export type ReceiveFileInfo = Omit<
  SendFileInfo,
  // keyof SenderInfo
  'load' | 'preSendInfo' | 'send' | 'sendPacketCount' | 'idBuffer' | 'file'
> & {
  // Receiver用プロパティ(Sender側でファイルリスト送信時に追加する)
  receive: number | null
  preReceiveInfo: boolean
  receivePacketCount: number
}
