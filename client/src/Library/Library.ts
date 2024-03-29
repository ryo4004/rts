import uniqid from 'uniqid'

export const GA_ID = 'G-4QY92612LZ'

export const appName = 'real-time-file-transfer'
export const version = process.env.REACT_APP_VERSION

export const divisionWidth = 960

// 定数
// ファイルIDは16文字
export const ID_LENGTH = 16
// 終了フラグサイズ
export const FLAG_LENGTH = 1
// 1つのpacketは16KB以下にする
export const PACKET_SIZE = 1024 * 16 - FLAG_LENGTH - ID_LENGTH

// // yyyy-mm-ddThh:mm:ss.sssZ
// export function getDate (str) {
//   return str.split('T')[0].replace(/-/g, '/')
// }

// // yyyy-mm-ddThh:mm:ss.sssZ
// export function getTime (str) {
//   return str.split('T')[1].split(':')[0] + ':' + str.split('T')[1].split(':')[1]
// }

export function fileIcon(name: string, type: string): string {
  const extension = name.indexOf('.') !== -1 ? name.split('.')[name.split('.').length - 1] : false
  // console.log(extension, name, type)
  if (type === 'text/html') {
    return 'fas fa-file-code'
  } else if (type.indexOf('text/css') === 0) {
    return 'fas fa-file-code'
  } else if (type.indexOf('text/javascript') === 0) {
    return 'fas fa-file-code'
  } else if (type.indexOf('application/json') === 0) {
    return 'fas fa-file-code'
  } else if (type.indexOf('application/x-zip-compressed') === 0) {
    return 'fas fa-file-archive'
  } else if (type.indexOf('application/pdf') === 0) {
    return 'fas fa-file-pdf'
  } else if (type.indexOf('application/vnd.openxmlformats-officedocument.wordprocessingml.document') === 0) {
    // 最新のWord
    return 'fas fa-file-word'
  } else if (type.indexOf('application/msword') === 0) {
    // 97-2003
    return 'fas fa-file-word'
  } else if (type.indexOf('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') === 0) {
    // 最新のExcel
    return 'fas fa-file-excel'
  } else if (type.indexOf('application/vnd.ms-excel') === 0) {
    // 97-2003
    if (extension === 'csv') {
      return 'fas fa-file-csv'
    }
    return 'fas fa-file-excel'
  } else if (type.indexOf('application/ms-excel') === 0) {
    // 不明
    return 'fas fa-file-excel'
  } else if (type.indexOf('application/vnd.openxmlformats-officedocument.presentationml.presentation') === 0) {
    // 最新のPowerPoint
    return 'fas fa-file-powerpoint'
  } else if (type.indexOf('application/vnd.ms-powerpoint') === 0) {
    // 97-2003
    return 'fas fa-file-powerpoint'
  } else if (type.indexOf('image') === 0) {
    return 'fas fa-file-image'
  } else if (type.indexOf('audio') === 0) {
    return 'fas fa-file-audio'
  } else if (type.indexOf('video') === 0) {
    return 'fas fa-file-video'
  } else if (type.indexOf('text') === 0) {
    return 'fas fa-file-alt'
  }
  if (extension === 'md') {
    return 'fas fa-file-code'
  } else if (extension === 'scss') {
    return 'fas fa-file-code'
  } else if (extension === 'gitignore') {
    return 'fas fa-file-code'
  } else if (extension === 'py') {
    return 'fas fa-file-code'
  }
  return 'fas fa-file'
}

export function fileSizeUnit(size: number) {
  // 1 KB = 1024 Byte
  const kb = 1024
  const mb = Math.pow(kb, 2)
  const gb = Math.pow(kb, 3)
  const tb = Math.pow(kb, 4)
  const pb = Math.pow(kb, 5)

  const round = (size: number, unit: number) => {
    return Math.round((size / unit) * 100.0) / 100.0
  }

  if (size >= pb) {
    return round(size, pb).toFixed(2) + 'PB'
  } else if (size >= tb) {
    return round(size, tb).toFixed(2) + 'TB'
  } else if (size >= gb) {
    return round(size, gb).toFixed(2) + 'GB'
  } else if (size >= mb) {
    return round(size, mb).toFixed(2) + 'MB'
  } else if (size >= kb) {
    return round(size, kb).toFixed(2) + 'KB'
  }
  return size + 'バイト'
}

export function randomString() {
  const character = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (var i = 0; i < 8; i++) {
    id += character[Math.floor(Math.random() * character.length)]
  }
  return uniqid.time() + id
}

// charCodeAtは65535までの値を返すが、idは英数字のみなので255以内に収まるはず
export function stringToBuffer(str: any) {
  // @ts-ignore
  return new Uint8Array([].map.call(str, (c) => c.charCodeAt(0)))
}

export function bufferToString(buffer: any) {
  // @ts-ignore
  return String.fromCharCode.apply('', new Uint8Array(buffer))
}

export const mobileClass = (mobile: boolean) => (mobile ? ' mobile' : ' pc')
export type MobileClassType = ' mobile' | ' pc'

export const noop = () => void 0
