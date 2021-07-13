import uniqid from 'uniqid'
import crypto from 'crypto'

export const noop = (): void => void 0

export function getHash(pass: string): string {
  const salt = '::HXAuymPGKKcThn6n'
  const hashsum = crypto.createHash('sha512')
  hashsum.update(pass + salt)
  return hashsum.digest('hex')
}

export function getAuthToken(userid: string): string {
  const time = new Date().getTime()
  return getHash(userid + time)
}

export function getUniqueString(length: number): string {
  const strong = length ? Math.pow(10, length) : 1000
  return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16)
}

export function getRandomString(length: number): string {
  const strong = length ? Math.pow(10, length + 1) : 1000
  return Math.floor(strong * Math.random()).toString(16)
}

export function randomString(): string {
  const character = '0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += character[Math.floor(Math.random() * character.length)]
  }
  return id
}

export function escapeReg(string: string): string {
  const reRegExp = /[\\^$.*+?()[\]{}|]/g
  const reHasRegExp = new RegExp(reRegExp.source)
  return string && reHasRegExp.test(string) ? string.replace(reRegExp, '\\$&') : string
}

export function showTime(): string {
  const time = new Date()
  const z = (v: number) => {
    const s = '00' + v
    return s.substr(s.length - 2, 2)
  }
  return (
    time.getFullYear() +
    '/' +
    (time.getMonth() + 1) +
    '/' +
    time.getDate() +
    ' ' +
    z(time.getHours()) +
    ':' +
    z(time.getMinutes()) +
    ':' +
    z(time.getSeconds())
  )
}

export function shuffle(string: string): string {
  const ary = string.split('')
  let i = ary.length
  while (i > 0) {
    const j = Math.floor(Math.random() * i)
    const t = ary[--i]
    ary[i] = ary[j]
    ary[j] = t
  }
  return ary.join('')
}
