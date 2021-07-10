export const Status = ({
  dataChannelOpenStatus,
  errorState = false,
  errorText = '',
}: {
  dataChannelOpenStatus: boolean
  errorState?: boolean
  errorText?: string
}) => {
  return (
    <div className="status">
      {errorState && <div className="error-status">{errorText}</div>}
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
