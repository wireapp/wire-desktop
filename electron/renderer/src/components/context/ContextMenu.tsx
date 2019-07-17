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

import React, {Component} from 'react';
import {connect} from 'react-redux';

import {setAccountContextHidden} from '../../actions';
import {RootState} from '../../reducers';
import './ContextMenu.css';

export interface Props extends React.HTMLProps<HTMLDivElement> {
  setAccountContextHidden: typeof setAccountContextHidden;
  position: {centerX: number; centerY: number};
}

class ContextMenu extends Component<Props> {
  private menu?: HTMLDivElement | null;

  componentDidMount() {
    this._registerListeners();
  }

  componentWillUnmount() {
    this._unregisterListeners();
  }

  private readonly _hide = () => {
    this.props.setAccountContextHidden();
  };

  private readonly _handleKeyDown = (event: KeyboardEvent) => {
    const KEY_ESCAPE = 27;
    if (event.keyCode === KEY_ESCAPE) {
      this._hide();
    }
  };

  private readonly _handleMouseDown = (event: MouseEvent) => {
    if (this.menu && !this.menu.contains(event.target as Node)) {
      this._hide();
    }
  };

  private readonly _handleMouseWheel = (event: MouseEvent) => {
    event.preventDefault();
  };

  private _registerListeners() {
    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('mousedown', this._handleMouseDown);
    window.addEventListener('resize', this._hide);
    window.addEventListener('wheel', this._handleMouseWheel);
  }

  private _unregisterListeners() {
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('mousedown', this._handleMouseDown);
    window.removeEventListener('resize', this._hide);
    window.removeEventListener('wheel', this._handleMouseWheel);
  }

  private readonly _handleRef = (menu: HTMLDivElement | null) => {
    if (menu) {
      this.menu = menu;
      const {centerX, centerY} = this.props.position;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;

      menu.style.left = `${windowWidth - centerX < menuWidth ? centerX - menuWidth : centerX}px`;
      menu.style.top = `${windowHeight - centerY < menuHeight ? centerY - menuHeight : centerY}px`;
    }
  };

  render() {
    return (
      <div className="ContextMenu" onClickCapture={this._hide} ref={this._handleRef}>
        {this.props.children}
      </div>
    );
  }
}

export default connect(
  ({contextMenuState}: RootState) => ({
    position: contextMenuState.position,
  }),
  {setAccountContextHidden},
)(ContextMenu);
