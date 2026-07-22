/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {CSSProperties} from 'react';

export const wrapperStyle: CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const frameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: 48,
  width: 576,
};

export const textStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  alignSelf: 'stretch',
  gap: 32,
  marginTop: 16,
};

export const titleStyle: CSSProperties = {
  fontFamily: 'SF Pro Text, sans-serif',
  fontSize: 24,
  fontWeight: 500,
  color: '#000',
  textAlign: 'center',
};

export const descriptionStyle: CSSProperties = {
  alignSelf: 'stretch',
  fontFamily: 'SF Pro Text, sans-serif',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '24px',
  letterSpacing: 0.05,
  color: '#000',
  textAlign: 'center',
};
