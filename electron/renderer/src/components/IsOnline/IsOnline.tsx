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

import {useEffect, useState, ReactElement} from 'react';
import {Text, ContainerSM} from '@wireapp/react-ui-kit';
import {getText} from '../../lib/locale';

interface IsOnlineProps {
  children: ReactElement;
}

export const IsOnline = ({children}: IsOnlineProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    window.addEventListener('online', setOnline);
    return () => {
      window.removeEventListener('online', setOnline);
    };
  });

  return isOnline ? (
    children
  ) : (
    <div style={{display: 'flex', height: '100%', width: '100%'}}>
      <ContainerSM centerText verticalCenter>
        <Text center block textTransform="uppercase">
          {getText('noInternet')}
        </Text>
      </ContainerSM>
    </div>
  );
};
