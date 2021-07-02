import request from 'superagent'

export function post(url: string, send: any, callback: (error: any, response: any) => void) {
  request
    .post(url)
    .type('form')
    .send(send)
    .end((error, response) => {
      return callback(error, response)
    })
}
