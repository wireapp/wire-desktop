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

import {IpcMessageEvent, WebviewTag} from 'electron';
import * as React from 'react';

import './Webview.css';

export interface Props extends React.HTMLAttributes<HTMLWebViewElement> {
  onClick?: (event: React.MouseEvent<HTMLWebViewElement>) => void;
  onIpcMessage: (event: IpcMessageEvent) => void;
  onPageTitleUpdated?: () => any;
  partition?: string;
  preload?: string;
  src: string;
  visible?: boolean;
  webpreferences?: string;
}

export interface State {}

class Webview extends React.Component<Props, State> {
  private webview?: WebviewTag;

  constructor(props: Props) {
    super(props);

    this.onIpcMessage = this.onIpcMessage.bind(this);
  }

  public componentDidMount() {
    const {src, partition} = this.props;

    if (this.webview) {
      // set unknown props
      // see: https://facebook.github.io/react/warnings/unknown-prop.html
      // see: https://github.com/electron/electron/issues/6046
      this.webview.partition = partition ? `persist:${partition}` : '';
      this.webview.src = src;

      this.webview.addEventListener('ipc-message', this.onIpcMessage);
    }

    this.focusWebview();
  }

  public componentDidUpdate() {
    this.focusWebview();
  }

  public shouldComponentUpdate(nextProps: Props) {
    if (nextProps.visible) {
      this.focusWebview();
    }
    return this.props.visible !== nextProps.visible;
  }

  private onIpcMessage(event: IpcMessageEvent) {
    this.props.onIpcMessage(event);
  }

  private focusWebview() {
    if (this.props.visible && this.webview) {
      this.webview.focus();
    }
  }

  render() {
    const {visible, partition, src, onPageTitleUpdated, onIpcMessage, ...validProps} = this.props; // eslint-disable-line no-unused-vars
    return <webview {...validProps} ref={webview => (this.webview = webview as WebviewTag)} />;
  }
}

export default Webview;
