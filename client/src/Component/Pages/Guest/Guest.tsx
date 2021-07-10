import { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'
import { receiverConnect, disconnect } from '../../../Actions/Connection'

import FileController from '../../Components/FileController/FileController'
import { Tutorial } from '../../Components/Tutorial/Tutorial'
import { Status } from '../../Components/Status/Status'
import { Footer } from '../../Components/Footer/Footer'

import type { State } from '../../../Store/Store'

import './Guest.scss'

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

  render() {
    const mobileMode = this.props.mobile ? ' mobile' : ' pc'
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
          <Tutorial isHost={false} />
          <Status
            dataChannelOpenStatus={this.props.dataChannelOpenStatus}
            errorState={this.props.errorState}
            errorText={this.props.errorText}
          />
          <FileController />
        </div>
        <Footer author={false} />
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Guest)
