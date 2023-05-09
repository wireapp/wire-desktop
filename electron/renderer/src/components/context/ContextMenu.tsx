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

import {ReactNode, useEffect, useRef} from 'react';

import {connect} from 'react-redux';

import './ContextMenu.css';

import {setAccountContextHidden} from '../../actions';
import {State} from '../../index';
import {ContextMenuSelector} from '../../selector/ContextMenuSelector';

type Position = {
  centerX: number;
  centerY: number;
};

interface ContextMenuProps {
  position: Position;
  children: ReactNode;
  setAccountContextHidden: () => void;
}

const ContextMenu = ({position, children, setAccountContextHidden}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hide = () => {
    setAccountContextHidden();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const KEY_ESCAPE = 27;
    if (event.keyCode === KEY_ESCAPE) {
      hide();
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      hide();
    }
  };

  const handleMouseWheel = (event: MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className="ContextMenu" ref={menuRef}>
      {children}
    </div>
  );
};

export default connect(
  (state: State) => ({
    position: ContextMenuSelector.getPosition(state),
  }),
  {setAccountContextHidden},
)(ContextMenu);
