import './Status.scss'

export const Status = ({
  dataChannelOpenStatus,
  selfID = null,
  errorState = false,
  errorText = '',
}: {
  dataChannelOpenStatus: boolean
  selfID?: string | null
  errorState?: boolean
  errorText?: string
}) => {
  const url = selfID ? 'https://' + window.location.host + '/' + selfID : '生成中...'
  const qrCode = selfID && (
    <img className="qr-code" src={'https://chart.apis.google.com/chart?cht=qr&chs=150x150&chl=' + url} alt="qr-code" />
  )
  return (
    <div className="status">
      {errorState && <div className="error-status">{errorText}</div>}
      {selfID && (
        <>
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
        <div className={dataChannelOpenStatus ? 'ok' : 'ng'}>
          <span>
            {dataChannelOpenStatus && <i className="fas fa-check-circle"></i>}
            {!dataChannelOpenStatus && <i className="fas fa-times-circle"></i>}
          </span>
          <label>dataChannel</label>
        </div>
      </div>
    </div>
  )
}

const copy = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, url: string) => {
  e.preventDefault()
  const div = document.createElement('div')
  div.appendChild(document.createElement('pre')).textContent = url
  document.body.appendChild(div)
  document.getSelection()?.selectAllChildren(div)
  document.execCommand('copy')
  document.body.removeChild(div)
}
