/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import React, { Component } from 'react';

import './Webview.css';

class Webview extends Component {
  constructor(props) {
    super(props);

    this._onIpcMessage = this._onIpcMessage.bind(this);
  }

  componentDidMount() {
    const {src, partition} = this.props;

    // set unknown props
    // see: https://facebook.github.io/react/warnings/unknown-prop.html
    // see: https://github.com/electron/electron/issues/6046
    this.webview.partition = partition ? `persist:${partition}` : '';
    this.webview.src = src;

    this.webview.addEventListener('ipc-message', this._onIpcMessage);

    this._focusWebview();
  }

  componentDidUpdate() {
    this._focusWebview();
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.visible) {
      this._focusWebview();
    }
    return this.props.visible !== nextProps.visible;
  }

  _onIpcMessage(event) {
    this.props.onIpcMessage(event);
  }

  _focusWebview() {
    const is_visible = this.props.visible === true;
    if (is_visible) {
      this.webview.focus();
    }
  }

  render() {
    const {visible, partition, src, onPageTitleUpdated, onIpcMessage, ...validProps} = this.props; // eslint-disable-line no-unused-vars
    return <webview {...validProps} ref={(webview) => this.webview = webview } />;
  }
}

export default Webview;
