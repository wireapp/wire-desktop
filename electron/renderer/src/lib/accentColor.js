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

export const STRONG_BLUE = {
  color: '#2391d3',
  id: 1,
  name: 'StrongBlue',
};

export const STRONG_LIME_GREEN = {
  color: '#00c800',
  id: 2,
  name: 'StrongLimeGreen',
};

export const VIVID_RED = {
  color: '#fb0807',
  id: 4,
  name: 'VividRed',
};

export const BRIGHT_ORANGE = {
  color: '#ff8900',
  id: 5,
  name: 'BrightOrange',
};

export const SOFT_PINK = {
  color: '#fe5ebd',
  id: 6,
  name: 'SoftPink',
};

export const VIOLET = {
  color: '#9c00fe',
  id: 7,
  name: 'Violet',
};

export const ACCENT_COLORS = [
  STRONG_BLUE,
  STRONG_LIME_GREEN,
  VIVID_RED,
  BRIGHT_ORANGE,
  SOFT_PINK,
  VIOLET,
];

export function colorFromId(id) {
  const accentColor = ACCENT_COLORS.find((color) => color.id === id);
  return accentColor && accentColor.color;
}