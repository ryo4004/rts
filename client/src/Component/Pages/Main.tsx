import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux'

import { windowWidthChange } from '../../Actions/Status'
import { addFile } from '../../Actions/Sender'

import Home from './Home/Home'
import Host from './Host/Host'
import Guest from './Guest/Guest'

import { mobileClass } from '../../Library/Library'

import type { State } from '../../Store/Store'

import './Main.scss'

function mapStateToProps(state: State) {
  return {
    mobile: state.status.mobile,
  }
}

function mapDispatchToProps(dispatch: any) {
  return {
    windowWidthChange() {
      dispatch(windowWidthChange())
    },
    addFile(fileList: any) {
      dispatch(addFile(fileList))
    },
  }
}

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>

class Main extends Component<Props> {
  contents: any

  constructor(props: Props) {
    super(props)
    this.contents = React.createRef()
  }

  componentWillMount() {}

  // Windowサイズの検出と記録
  componentDidMount() {
    this.props.windowWidthChange()
    window.addEventListener('resize', () => {
      this.props.windowWidthChange()
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => {})
  }

  onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files.length === 0) return false
    this.props.addFile(e.dataTransfer.files)
  }

  render() {
    const mobileMode = mobileClass(this.props.mobile)
    return (
      <div
        className={'contents' + mobileMode}
        ref={this.contents}
        onDragOver={(e) => this.onDragOver(e)}
        onDrop={(e) => this.onDrop(e)}
      >
        <div className="drop-frame"></div>
        <Switch>
          <Route path="/host" component={Host} />
          <Route path="/:senderSocketID" component={Guest} />
          <Route path="/" component={Home} />
        </Switch>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main)
