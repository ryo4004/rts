import { mobileClass } from '../../../Library/Library'

import './Status.scss'

export const Status = ({
  dataChannelOpenStatus,
  selfID = null,
  errorState = false,
  errorText = '',
  mobile,
}: {
  dataChannelOpenStatus: boolean | null
  selfID?: string | null
  errorState: boolean | undefined
  errorText: string | undefined
  mobile: boolean
}) => {
  const url = selfID ? 'https://' + window.location.host + '/' + selfID : '生成中...'
  const qrCode = selfID && (
    <img className="qr-code" src={'https://chart.apis.google.com/chart?cht=qr&chs=150x150&chl=' + url} alt="qr-code" />
  )

  return (
    <div className={'status' + mobileClass(mobile)}>
      {errorState && <div className="error-status">{errorText}</div>}
      {!errorState && selfID && dataChannelOpenStatus === null && (
        <>
          <div className="selfid">
            <label>あなたのID</label>
            <span>{selfID}</span>
          </div>
          <span className="id-guide">接続先でこのIDを指定してください</span>
          <div className="url">
            <span>共有URL</span>
            <div onClick={(e) => copy(e, url)} className="copy-button">
              {url}
              <i className="fas fa-clone"></i>
            </div>
          </div>
          <span className="url-guide">URLをクリックでコピー</span>
          {qrCode}
        </>
      )}
      <div className="data-channel-status">
        {dataChannelOpenStatus === null && <NoConnection />}
        {dataChannelOpenStatus === true && <Connection />}
        {dataChannelOpenStatus === false && <DisabledConnection />}
      </div>
    </div>
  )
}

const NoConnection = () => (
  <div className="before">
    <span>
      <i className="fas fa-minus-circle"></i>
    </span>
    <label>未接続</label>
  </div>
)

const Connection = () => (
  <div className="ok">
    <span>
      <i className="fas fa-check-circle"></i>
    </span>
    <label>接続中</label>
  </div>
)

const DisabledConnection = () => (
  <div className="ng">
    <span>
      <i className="fas fa-times-circle"></i>
    </span>
    <label>切断しました</label>
  </div>
)

const copy = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, url: string) => {
  e.preventDefault()
  const div = document.createElement('div')
  div.appendChild(document.createElement('pre')).textContent = url
  document.body.appendChild(div)
  document.getSelection()?.selectAllChildren(div)
  document.execCommand('copy')
  document.body.removeChild(div)
}
