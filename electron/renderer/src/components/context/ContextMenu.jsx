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

import './ContextMenu.css';

import React, {useEffect, useRef} from 'react';
import {connect} from 'react-redux';

import {setAccountContextHidden} from '../../actions';

const ContextMenu = ({position, children, setAccountContextHidden}) => {
  const menuRef = useRef();

  useEffect(() => {
    if (menuRef.current) {
      const {centerX, centerY} = position;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;

      menuRef.current.style.left = `${windowWidth - centerX < menuWidth ? centerX - menuWidth : centerX}px`;
      menuRef.current.style.top = `${windowHeight - centerY < menuHeight ? centerY - menuHeight : centerY}px`;
    }
  }, [menuRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', hide);
    window.addEventListener('wheel', handleMouseWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', hide);
      window.removeEventListener('wheel', handleMouseWheel);
    };
  }, []);

  const hide = () => {
    setAccountContextHidden();
  };

  const handleKeyDown = event => {
    const KEY_ESCAPE = 27;
    if (event.keyCode === KEY_ESCAPE) {
      hide();
    }
  };

  const handleMouseDown = event => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      hide();
    }
  };

  const handleMouseWheel = event => {
    event.preventDefault();
  };

  return (
    <div className="ContextMenu" onClickCapture={hide} ref={menuRef}>
      {children}
    </div>
  );
};

export default connect(
  ({contextMenuState}) => ({
    position: contextMenuState.position,
  }),
  {setAccountContextHidden},
)(ContextMenu);
