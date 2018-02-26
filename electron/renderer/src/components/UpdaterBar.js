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
import * as anime from 'animejs';
import { getText } from '../lib/locale';

import './UpdaterBar.css';

class UpdaterBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isUpdateAvailable: false,
      screenshot: false,
    };
    this.defaultAnimationSettings = {
      easing: 'easeInOutSine',
      duration: 600,
    };
    this._onUpdateAvailable = this._onUpdateAvailable.bind(this);
    this._onUpdateInstalled = this._onUpdateInstalled.bind(this);
    this._onClickOnDetails = this._onClickOnDetails.bind(this);
    this._onUpdateStartInstall = this._onUpdateStartInstall.bind(this);
    this._onUpdateEndInstall = this._onUpdateEndInstall.bind(this);
  }

  componentDidMount() {
    window.addEventListener('update-available', this._onUpdateAvailable);
    window.addEventListener('update-start-install', this._onUpdateStartInstall);
    window.addEventListener('update-end-install', this._onUpdateEndInstall);
    window.addEventListener('update-installed', this._onUpdateInstalled);
  }

  componentDidUpdate() {}

  _onUpdateStartInstall(event) {
    // Freeze window
    const screenshot = event.detail.screenshot;
    this.setState({
      screenshot,
    });
    anime({
      ...this.defaultAnimationSettings,
      targets: this.screenshot,
      opacity: [0, 1],
    });
  }

  _onUpdateEndInstall(event) {
    // Unfreeze window
    anime({
      ...this.defaultAnimationSettings,
      targets: this.screenshot,
      opacity: [1, 0],
      delay: 4000,
      complete: () => {
        this.setState({
          screenshot: false,
        });
      }
    });
  }

  _onUpdateAvailable(event) {
    this.setState({
      isUpdateAvailable: true,
    });
    window.dispatchEvent(new CustomEvent('update-available-ack', {}));
  }

  _onUpdateInstalled(event) {
    this.setState({
      isUpdateAvailable: false,
    });
  }

  _onClickOnDetails(event) {
    event.preventDefault();
    console.log('Click on more detected');
    window.dispatchEvent(new CustomEvent('update-available-display', {}));
  }

  render() {
    return (
      <div className="UpdaterContainer">
        <img ref={elem => this.screenshot = elem} className={this.state.screenshot ? 'updater-freeze' : 'updater-freeze-hidden'} src={this.state.screenshot ? this.state.screenshot : ''} />
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
