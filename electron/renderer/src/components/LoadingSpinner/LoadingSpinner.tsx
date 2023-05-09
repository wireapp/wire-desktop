/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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

import {useEffect, useState, MutableRefObject} from 'react';

import {FlexBox, Loading, COLOR} from '@wireapp/react-ui-kit';

import './LoadingSpinner.css';

type WebviewTag = Electron.WebviewTag;

const TRANSITION_GRACE_PERIOD_MS = 500;

interface LoadingSpinnerProps {
  visible: boolean;
  webviewRef: MutableRefObject<WebviewTag | null>;
}

export const LoadingSpinner = ({visible, webviewRef}: LoadingSpinnerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const webview = webviewRef.current;
    const setLoading = () => setIsLoading(false);

    if (webview) {
      webview.addEventListener('did-finish-load', setLoading);
      return () => {
        webview.removeEventListener('did-finish-load', setLoading);
      };
    }

    return () => undefined;
  });

  useEffect(() => {
    if (!isLoading) {
      let timeout: NodeJS.Timeout | null = setTimeout(() => {
        timeout = null;
        setIsFinished(true);
      }, TRANSITION_GRACE_PERIOD_MS);

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
      };
    }

    return () => undefined;
  }, [isLoading]);

  if (!visible || isFinished) {
    return null;
  }
  return (
    <div
      className="loading-spinner-wrapper"
      data-uie-name="loading-spinner-wrapper"
      style={{
        backgroundColor: COLOR.GRAY_LIGHTEN_88,
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? 'all' : 'none',
      }}
    >
      <FlexBox align="center" justify="space-around" className="loading-spinner-box">
        <Loading data-uie-name="loading-spinner-element" />
      </FlexBox>
    </div>
  );
};
