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

import * as React from 'react';
import {connect} from 'react-redux';
import {setAccountContextHidden} from '../../actions/';
import {RootState} from '../../reducers/';

import './ContextMenu.css';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {}

export interface DispatchProps {
  setAccountContextHidden: () => void;
}

export interface ConnectedProps {
  position: {
    x: number;
    y: number;
  };
}

export interface State {}

export type CombinedProps = Props & ConnectedProps & DispatchProps;

class ContextMenu extends React.Component<CombinedProps, State> {
  private menu: any;

  constructor(props: CombinedProps) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.hide = this.hide.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.handleRef = this.handleRef.bind(this);
  }

  public componentDidMount() {
    this.registerListeners();
  }

  public componentWillUnmount() {
    this.unregisterListeners();
  }

  private hide() {
    this.props.setAccountContextHidden();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 27) {
      this.hide();
    }
  }

  private handleMouseDown(event: MouseEvent) {
    if (this.menu && !this.menu.contains(event.target)) {
      this.hide();
    }
  }

  private handleMouseWheel(event: WheelEvent) {
    event.preventDefault();
  }

  private registerListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('resize', this.hide);
    window.addEventListener('wheel', this.handleMouseWheel);
  }

  private unregisterListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('resize', this.hide);
    window.removeEventListener('wheel', this.handleMouseWheel);
  }

  private handleRef(menu: any) {
    if (menu) {
      this.menu = menu;
      const {x, y} = this.props.position;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;

      menu.style.left = `${windowWidth - x < menuWidth ? x - menuWidth : x}px`;
      menu.style.top = `${windowHeight - y < menuHeight ? y - menuHeight : y}px`;
    }
  }

  render() {
    return (
      <div className="ContextMenu" onClickCapture={this.hide} ref={this.handleRef}>
        {this.props.children}
      </div>
    );
  }
}

export default connect(
  (state: RootState) => ({
    position: state.contextMenuState.position,
  }),
  {setAccountContextHidden}
)(ContextMenu);
