import { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'
import { senderConnect, disconnect } from '../../../Actions/Connection'
import { sendData, deleteFile } from '../../../Actions/Sender'

import FileController from '../../Components/FileController/FileController'
import { Tutorial } from '../../Components/Tutorial/Tutorial'
import { Status } from '../../Components/Status/Status'
import { Footer } from '../../Components/Footer/Footer'

import { mobileClass } from '../../../Library/Library'

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

    // エラー
    errorState: state.sender.errorState,
    errorText: state.sender.errorText,
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

  render() {
    const mobileMode = mobileClass(this.props.mobile)
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
          <Tutorial isHost={true} mobile={this.props.mobile} />
          <Status
            dataChannelOpenStatus={this.props.dataChannelOpenStatus}
            selfID={this.props.selfID}
            errorState={this.props.errorState}
            errorText={this.props.errorText}
            mobile={this.props.mobile}
          />
          <FileController />
        </div>
        <Footer author={false} />
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Host)
