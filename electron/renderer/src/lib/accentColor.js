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

export const BLUE = {
  color: '#0667c8',
  id: 1,
  name: 'Blue',
};

export const GREEN = {
  color: '#1d7833',
  id: 2,
  name: 'Green',
};

export const RED = {
  color: '#c20013',
  id: 4,
  name: 'Red',
};

export const AMBER = {
  color: '#a25915',
  id: 5,
  name: 'Orange',
};

export const TURQUOISE = {
  color: '#01718e',
  id: 6,
  name: 'Turquoise',
};

export const PURPLE = {
  color: '#8944ab',
  id: 7,
  name: 'Purple',
};

export const ACCENT_COLORS = [BLUE, GREEN, RED, AMBER, TURQUOISE, PURPLE];

export const colorFromId = id => {
  const accentColor = ACCENT_COLORS.find(color => color.id === id);
  return accentColor && accentColor.color;
};
