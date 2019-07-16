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

import {WebviewTag} from 'electron';
import React, {Component} from 'react';

import './Webview.css';
import {IpcData} from './Webviews';

export interface Props extends React.HTMLProps<WebviewTag> {
  onIpcMessage: (event: IpcData) => void;
  onPageTitleUpdated?: () => void;
  partition?: string;
  visible?: boolean;
  webpreferences?: string;
}

export default class Webview extends Component<Props> {
  private webview?: WebviewTag | null;

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    if (this.webview) {
      // set unknown props
      // see: https://facebook.github.io/react/warnings/unknown-prop.html
      // see: https://github.com/electron/electron/issues/6046
      this.webview.partition = this.props.partition ? `persist:${this.props.partition}` : '';
      this.webview.src = this.props.src;

      this.webview.addEventListener('ipc-message', this._onIpcMessage);
      this.webview.addEventListener('dom-ready', () => this._focusWebview());
    }
  }

  componentDidUpdate() {
    this._focusWebview();
  }

  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.visible) {
      this._focusWebview();
    }
    return this.props.visible !== nextProps.visible;
  }

  private readonly _onIpcMessage = (event: IpcData) => {
    this.props.onIpcMessage(event);
  };

  private _focusWebview() {
    if (this.props.visible && this.webview) {
      this.webview.blur();
      this.webview.focus();
      this.webview.getWebContents().focus();
    }
  }

  render() {
    const {visible, partition, src, onPageTitleUpdated, onIpcMessage, ...validProps} = this.props;
    return <webview {...validProps} ref={webview => (this.webview = webview as WebviewTag)} />;
  }
}
