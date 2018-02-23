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
import { getText } from '../lib/locale';

import './UpdaterBar.css';

class UpdaterBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isUpdateAvailable: false,
    };
    this._onUpdateAvailable = this._onUpdateAvailable.bind(this);
    this._onClickOnDetails = this._onClickOnDetails.bind(this);
  }

  componentDidMount() {
    window.addEventListener('update-available', this._onUpdateAvailable);
  }

  componentDidUpdate() {}

  _onUpdateAvailable(event) {
    this.setState({
      isUpdateAvailable: true,
    });
    window.dispatchEvent(new CustomEvent('update-available-ack', {}));
  }

  _onClickOnDetails(event) {
    event.preventDefault();
    console.log('Click on more detected');
    window.dispatchEvent(new CustomEvent('update-available-display', {}));
  }

  render() {
    return (
      <div className="UpdaterContainer">
        {this.state.isUpdateAvailable ? (
          <div className="updater-bar updater-bar-connection">
            <div className="updater-bar-message">
              <span>{getText('wrapperUpdateAvailable')}</span>&nbsp;
              <a className="updater-bar-click" href="javascript://" onClick={this._onClickOnDetails}>{getText('wrapperUpdateDetails')}</a>
            </div>
          </div>
        ) : ''}
        <div className={this.state.isUpdateAvailable ? 'updater-bar-resize' : 'updater-bar-no-resize'}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default UpdaterBar;
