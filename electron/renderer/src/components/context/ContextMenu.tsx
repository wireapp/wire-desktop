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

import {KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useRef} from 'react';

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
  shouldAutoFocus?: boolean;
}

enum MenuKey {
  ArrowDown = 'ArrowDown',
  ArrowUp = 'ArrowUp',
  Escape = 'Escape',
  Tab = 'Tab',
}

const ContextMenu = ({position, children, setAccountContextHidden, shouldAutoFocus = false}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuRef.current) {
      return;
    }

    const {centerX, centerY} = position;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;

    menuRef.current.style.left = `${windowWidth - centerX < menuWidth ? centerX - menuWidth : centerX}px`;
    menuRef.current.style.top = `${windowHeight - centerY < menuHeight ? centerY - menuHeight : centerY}px`;

    if (shouldAutoFocus) {
      const firstMenuItem = menuRef.current.querySelector('[data-uie-name="item-context-menu"]') as HTMLElement | null;
      firstMenuItem?.focus();
    }
  }, [position, shouldAutoFocus]);

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
    if (event.key === MenuKey.Escape) {
      hide();
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === MenuKey.Escape) {
      event.preventDefault();
      event.stopPropagation();
      hide();
      return;
    }

    if (event.key !== MenuKey.ArrowDown && event.key !== MenuKey.ArrowUp && event.key !== MenuKey.Tab) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (!menuRef.current) {
      return;
    }

    const menuItems = Array.from(
      menuRef.current.querySelectorAll('[data-uie-name="item-context-menu"]'),
    ) as HTMLElement[];

    if (!menuItems.length) {
      return;
    }

    const currentElement = document.activeElement as HTMLElement | null;
    const currentIndex = currentElement ? menuItems.indexOf(currentElement) : -1;

    const direction =
      event.key === MenuKey.ArrowDown ? 1 : event.key === MenuKey.ArrowUp ? -1 : event.shiftKey ? -1 : 1;
    const fallbackIndex = direction === 1 ? 0 : menuItems.length - 1;
    const nextIndex =
      currentIndex === -1 ? fallbackIndex : (currentIndex + direction + menuItems.length) % menuItems.length;

    menuItems[nextIndex]?.focus();
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
    // menus best practice is to move focus to the first menu item
    // Keep the wrapper out of tab order
    <div role="menu" tabIndex={-1} className="ContextMenu" ref={menuRef} onKeyDown={handleMenuKeyDown}>
      {children}
    </div>
  );
};

export default connect(
  (state: State) => ({
    position: ContextMenuSelector.getPosition(state),
    shouldAutoFocus: ContextMenuSelector.shouldAutoFocus(state),
  }),
  {setAccountContextHidden},
)(ContextMenu);
