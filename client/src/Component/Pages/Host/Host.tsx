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
      </div>
    )
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
          <Status dataChannelOpenStatus={this.props.dataChannelOpenStatus} selfID={this.props.selfID} />
          <FileController />
        </div>
        <Footer author={false} />
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Host)
