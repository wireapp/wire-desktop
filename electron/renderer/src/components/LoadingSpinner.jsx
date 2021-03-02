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

// @ts-check

import React, {useEffect, useState} from 'react';
import {FlexBox, Loading, COLOR, TransitionContainer, Opacity} from '@wireapp/react-ui-kit';

const LoadingSpinner = ({webviewRef}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const webview = webviewRef.current;
    const setLoading = () => setIsLoading(false);

    if (webview) {
      webview.addEventListener('did-finish-load', setLoading);
      return () => {
        webview.removeEventListener('did-finish-load', setLoading);
      };
    }
  });

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'absolute',
        width: '100%',
        zIndex: 99,
      }}
      data-uie-name="loading-spinner-wrapper"
    >
      <TransitionContainer
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        {isLoading && (
          <Opacity timeout={500}>
            <div
              style={{
                backgroundColor: COLOR.GRAY_LIGHTEN_88,
                display: 'flex',
                height: '100vh',
              }}
            >
              <FlexBox align="center" justify="space-around" style={{margin: '0 auto'}}>
                <Loading data-uie-name="loading-spinner-element" />
              </FlexBox>
            </div>
          </Opacity>
        )}
      </TransitionContainer>
    </div>
  );
};

export default LoadingSpinner;
