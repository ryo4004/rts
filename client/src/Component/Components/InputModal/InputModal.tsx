import React, { Component } from 'react'
import './InputModal.scss'

export const InputModal = ({ replace }: { replace: (location: string) => void }) => {
  return <Input inputRef={null} replace={replace} />
}

type InputProps = {
  inputRef: any
  replace: (location: string) => void
}

type InputState = {
  input: string
}

class Input extends Component<InputProps, InputState> {
  private inputRef = React.createRef<HTMLInputElement>()

  constructor(props: InputProps) {
    super(props)
    this.inputRef = React.createRef()
    this.state = {
      input: '',
    }
  }

  componentDidMount() {
    if (this.inputRef) {
      // とりあえずfocusはしない
      // this.inputRef.current?.focus()
    }
  }

  componentDidUpdate() {
    const { input } = this.state
    if (input.length === 6 && Number.isInteger(parseInt(input))) {
      this.setState({ input: '' })
      this.props.replace('/' + input)
    }
  }

  render() {
    return (
      <div className="input">
        <input
          ref={this.inputRef}
          value={this.state.input}
          onChange={(e) => this.setState({ input: e.target.value })}
          type="number"
          pattern="\d*"
        />
      </div>
    )
  }
}
