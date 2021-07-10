import { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'
import { senderConnect, disconnect } from '../../../Actions/Connection'
import { sendData, deleteFile } from '../../../Actions/Sender'

import FileController from '../../Components/FileController/FileController'
import { Status } from '../../Components/Status/Status'
import { Footer } from '../../Components/Footer/Footer'

import type { State } from '../../../Store/Store'

import './Host.scss'

function mapStateToProps(state: State) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,
    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // connection
    selfID: state.connection.selfSocketID,
    receiverID: state.connection.receiverSocketID,
    dataChannelOpenStatus: state.connection.dataChannelOpenStatus,

    // ファイル送信用
    sendFileList: state.sender.sendFileList,
    sendFileStorage: state.sender.sendFileStorage,
  }
}

function mapDispatchToProps(dispatch: any) {
  return {
    prepare() {
      dispatch(prepare())
    },
    senderConnect() {
      dispatch(senderConnect())
    },
    disconnect() {
      dispatch(disconnect())
    },
    sendData() {
      dispatch(sendData())
    },
    deleteFile(id: any) {
      dispatch(deleteFile(id))
    },
  }
}

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>

class Host extends Component<Props> {
  componentDidMount() {
    this.props.senderConnect()
  }

  componentWillUnmount() {
    this.props.disconnect()
  }

  renderTutorial() {
    const selfID = this.props.selfID ? this.props.selfID : false
    const url = selfID ? 'https://' + window.location.host + '/' + selfID : 'generating...'
    const qrCode = selfID ? (
      <img
        className="qr-code"
        src={'https://chart.apis.google.com/chart?cht=qr&chs=150x150&chl=' + url}
        alt="qr-code"
      />
    ) : (
      false
    )
    return (
      <div className="tutorial">
        <h3>使い方</h3>
        <ol>
          <li>共有URLをファイルを受け取る相手に通知します</li>
          <li>自動的に相手との間にP2P接続を試みます</li>
          <li>
            相手との間に接続が確立するとdataChannelマークが<i className="fas fa-check-circle"></i>になります
          </li>
          <li>ファイルを追加して送信ボタンを押すとファイルを送信できます</li>
        </ol>
        <div className="url">
          <span>共有URL</span>
          <div onClick={(e) => this.copy(e, url)} className="copy-button">
            {url}
            <i className="fas fa-clone"></i>
          </div>
        </div>
        <span className="url-guide">URLをクリックでコピー</span>
        {qrCode}
      </div>
    )
  }

  copy(e: any, url: string) {
    e.preventDefault()
    // console.log(url)
    const div = document.createElement('div')
    div.appendChild(document.createElement('pre')).textContent = url
    document.body.appendChild(div)
    document.getSelection()?.selectAllChildren(div)
    document.execCommand('copy')
    document.body.removeChild(div)
  }

  render() {
    const mobileMode = this.props.mobile ? ' mobile' : ' pc'
    const tutorial = this.renderTutorial()
    return (
      <div className={'host' + mobileMode}>
        <header>
          <div>
            <h2>
              <Link to="/">Real-Time File Transfer</Link>
            </h2>
          </div>
        </header>
        <div className="main">
          {tutorial}
          <Status dataChannelOpenStatus={this.props.dataChannelOpenStatus} />
          <FileController />
        </div>
        <Footer author={false} />
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Host)
