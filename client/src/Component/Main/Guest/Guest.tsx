import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'
import { receiverConnect, disconnect } from '../../../Actions/Connection'

import FileController from '../FileController/FileController'

import type { State } from '../../../Store/Store'

import './Guest.css'

function mapStateToProps(state: State) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,
    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // connection
    selfID: state.connection.selfSocketID,
    senderID: state.connection.senderSocketID,
    dataChannelOpenStatus: state.connection.dataChannelOpenStatus,

    // ファイル受信用
    receiveFileList: state.receiver.receiveFileList,
    receiveFileUrlList: state.receiver.receiveFileUrlList,

    // エラー
    errorState: state.receiver.errorState,
    errorText: state.receiver.errorText,
  }
}

function mapDispatchToProps(dispatch: any) {
  return {
    prepare() {
      dispatch(prepare())
    },
    receiverConnect(senderSocketID: string) {
      dispatch(receiverConnect(senderSocketID))
    },
    disconnect() {
      dispatch(disconnect())
    },
  }
}

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>

class Guest extends Component<Props> {
  componentDidMount() {
    this.props.prepare()
    // @ts-ignore
    const { params } = this.props.match
    const senderSocketID = params.senderSocketID ? params.senderSocketID : ''
    this.props.receiverConnect(senderSocketID)
  }

  componentWillUnmount() {
    this.props.disconnect()
  }

  renderTutorial() {
    return (
      <div className="tutorial">
        <h3>使い方</h3>
        <ol>
          <li>自動的に相手との間にP2P接続を試みます</li>
          <li>
            相手との間に接続が確立するとdataChannelマークが<i className="fas fa-check-circle"></i>になります
          </li>
          <li>ファイルを追加して送信ボタンを押すとファイルを送信できます</li>
        </ol>
      </div>
    )
  }

  renderStatus() {
    // const available = this.props.available === true ? 'OK' : 'NG'
    // const socketID = this.props.socket ? this.props.socket.id : '-'
    // const selfID = this.props.selfID ? this.props.selfID : '-'
    // const senderID = this.props.senderID ? this.props.senderID : '-'
    const renderError = this.props.errorState ? <div className="error-status">{this.props.errorText}</div> : false
    return (
      <div className="status">
        {/* <div>status: {available}</div>
        <div>socketid: {socketID}</div>
        <div>selfID: {selfID}</div>
        <div>senderID: {senderID}</div> */}
        {renderError}
        <div className="data-channel-status">
          <div className={this.props.dataChannelOpenStatus ? 'ok' : 'ng'}>
            <span>
              {this.props.dataChannelOpenStatus ? (
                <i className="fas fa-check-circle"></i>
              ) : (
                <i className="fas fa-times-circle"></i>
              )}
            </span>
            <label>dataChannel</label>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const mobileMode = this.props.mobile ? ' mobile' : ' pc'
    const tutorial = this.renderTutorial()
    const status = this.renderStatus()
    return (
      <div className={'guest' + mobileMode}>
        <header>
          <div>
            <h2>
              <Link to="/">Real-Time File Transfer</Link>
            </h2>
          </div>
        </header>
        <div className="main">
          {tutorial}
          {status}
          <FileController />
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Guest)
