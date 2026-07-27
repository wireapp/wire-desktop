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

import {Logo} from '@wireapp/react-ui-kit';

import {descriptionStyle, frameStyle, textStyle, titleStyle, wrapperStyle} from './NoUrlConfigured.styles';

import {getText} from '../../lib/locale';

interface NoUrlConfiguredProps {
  accountId: string;
  visible: boolean;
}

export const NoUrlConfigured = ({accountId, visible}: NoUrlConfiguredProps) => (
  <div
    // Needed so AccountAction.switchWebview's `.Webview[data-accountid=...]` lookup can find this slot.
    className="Webview"
    data-accountid={accountId}
    data-uie-name="status-no-url-configured"
    style={{...wrapperStyle, display: visible ? wrapperStyle.display : 'none'}}
  >
    <div style={frameStyle}>
      <Logo scale={1.68} />
      <div style={textStyle}>
        <div style={titleStyle}>{getText('noUrlConfiguredTitle')}</div>
        <div style={descriptionStyle}>{getText('noUrlConfiguredDescription')}</div>
      </div>
    </div>
  </div>
);
