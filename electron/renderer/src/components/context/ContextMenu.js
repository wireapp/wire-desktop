/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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
import { connect } from 'react-redux';
import { setAccountContextHidden } from '../../actions';

import './ContextMenu.css';

class ContextMenu extends Component {
  constructor(props) {
    super(props);

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._hide = this._hide.bind(this);
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);
    this._handleRef = this._handleRef.bind(this);
  }

  componentDidMount() {
    this._registerListeners();
  }

  componentWillUnmount() {
    this._unregisterListeners();
  }

  _hide() {
    this.props.setAccountContextHidden();
  }

  _handleKeyDown(event) {
    if (event.keyCode === 27) {
      this._hide();
    }
  }

  _handleMouseDown(event) {
    if (!this.menu.contains(event.target)) {
      this._hide();
    }
  }

  _handleMouseWheel(event) {
    event.preventDefault();
  }

  _registerListeners() {
    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('mousedown', this._handleMouseDown);
    window.addEventListener('resize', this._hide);
    window.addEventListener('wheel', this._handleMouseWheel);
  }

  _unregisterListeners() {
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('mousedown', this._handleMouseDown);
    window.removeEventListener('resize', this._hide);
    window.removeEventListener('wheel', this._handleMouseWheel);
  }

  _handleRef(menu) {
    if (!menu) {
      return;
    }
    this.menu = menu;
    const { x, y } = this.props.position;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    menu.style.left = `${windowWidth - x < menuWidth ? x - menuWidth : x}px`;
    menu.style.top = `${windowHeight - y < menuHeight ? y - menuHeight : y}px`;
  }

  render() {
    return this.props.visible ? (
      <div
        className="ContextMenu"
        onClickCapture={this._hide}
        ref={this._handleRef}
      >
        {this.props.children}
      </div>
    ) : null;
  }
}

export default connect(
  state => ({
    position: state.contextMenuState.accountContextPosition,
    visible: state.contextMenuState.isAccountContextMenuVisible,
  }),
  { setAccountContextHidden }
)(ContextMenu);
