import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import './Webview.css'

class Webview extends Component {
    constructor(props) {
        super(props)

        this._onPageTitleUpdated = this._onPageTitleUpdated.bind(this)
    }

    componentDidMount() {
        const {src, partition} = this.props

        // set unknown props
        // see: https://facebook.github.io/react/warnings/unknown-prop.html
        // see: https://github.com/electron/electron/issues/6046
        this.webview.partition = partition ? `persist:${partition}` : ''
        this.webview.src = src

        this.webview.addEventListener('page-title-updated', this._onPageTitleUpdated)
    }

    _onPageTitleUpdated(title) {
        this.props.onPageTitleUpdated(title)
    }

    render() {
        const {className, preload} = this.props
        return <webview className={className} preload={preload} ref={(webview) => { this.webview = webview; }} />
    }
}

export default Webview
