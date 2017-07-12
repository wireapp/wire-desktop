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
import PropTypes from 'prop-types';

import './ContextMenu.css';

export class ContextMenuTrigger extends Component {
  constructor(props) {
    super(props);

    this._handleClick = this._handleClick.bind(this);
  }

  _getElementCenter(element) {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return {
      x: left + ((right - left) / 2),
      y: top + ((bottom - top) / 2),
    };
  }

  _handleClick(event) {
    document.dispatchEvent(new CustomEvent(`context-menu-event-${this.props.id}`, {
      detail: {
        position: this._getElementCenter(event.currentTarget),
        target: event.target,
      },
    }));
  }

  render() {
    return (
      <div onClick={this._handleClick}>{ this.props.children }</div>
    );
  }
}

ContextMenuTrigger.propTypes = {
  id: PropTypes.string.isRequired,
};


export const ContextMenuItem = (props) =>
  <div data-uie-name="item-context-menu" className="ContextMenu-item" onClick={props.onClick}>
    { props.children }
  </div>;

ContextMenuTrigger.propTypes = {
  onClick: PropTypes.func,
};


export class ContextMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      position: {
        x: 0,
        y: 0,
      },
      visible: false,
    };

    this._handleContextMenuEvent = this._handleContextMenuEvent.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleRef = this._handleRef.bind(this);
    this._hide = this._hide.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);
  }

  _show(position) {
    this.setState({
      position,
      visible: true,
    });
    this._registerListeners();
  }

  _hide() {
    this.setState({ visible: false });
    this._unregisterListeners();
  }

  componentDidUpdate(props, state) {
    document.addEventListener(`context-menu-event-${this.props.id}`, this._handleContextMenuEvent);
  }

  componentWillUnmount() {
    document.removeEventListener(`context-menu-event-${this.props.id}`, this._handleContextMenuEvent);
    this._unregisterListeners();
  }

  _handleContextMenuEvent(event) {
    this._show(event.detail.position);
    this._registerListeners();
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

  _handleRef(node) {
    this.menu = node;

    if (this.menu == null) {
      return;
    }

    const {x, y} = this.state.position;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const menuWidth = this.menu.offsetWidth;
    const menuHeight = this.menu.offsetHeight;

    this.menu.style.left = `${((windowWidth - x) < menuWidth ? x - menuWidth : x)}px`;
    this.menu.style.top = `${((windowHeight - y) < menuHeight ? y - menuHeight : y)}px`;
    this.menu.style.visibilty = 'visible';
  }

  render() {
    return (this.state.visible &&
      <div className="ContextMenu" style={{ visibilty: 'hidden' }} ref={this._handleRef}>
        { this.props.children }
      </div>
    );
  }
}
