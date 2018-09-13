#!/usr/bin/env python
# coding: utf-8

#
# Wire
# Copyright (C) 2018 Wire Swiss GmbH
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see http://www.gnu.org/licenses/.
#

import os
import requests

HOCKEY_APP_ID = os.environ.get('MACOS_PROD_HOCKEY_ID')
HOCKEY_TOKEN = os.environ.get('MACOS_HOCKEY_TOKEN')
VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]

HOCKEY_BASE_URL = 'https://rink.hockeyapp.net/api/2/apps/{APP_ID}}'.format(HOCKEY_APP_ID)
HOCKEY_URL_UPLOAD = '{BASE_URL}/app_versions/'.format(HOCKEY_BASE_URL)

bin_root = os.path.dirname(os.path.realpath(__file__))
wire_zip = os.path.join(bin_root, 'WireInternal.zip')


def ditto(source, destination):
  os.system('ditto -c -k --sequesterRsrc --keepParent {SOURCE} {DESTINATION}'.format(SOURCE=source, DESTINATION=destination))


if __name__ == '__main__':
    print 'Uploading Wire for macOS ({VERSION}-internal)...'.format(VERSION)
    semver_version = VERSION.split('.')

    headers = {'X-HockeyAppToken': HOCKEY_TOKEN}
    data = {
        'notes': 'New build of Wire macOS ({VERSION}-internal)'.format(VERSION),
        'notify': 0,
        'status': 2,
    }
    files = {'ipa': open(wire_zip, 'rb')}

    response = requests.post(HOCKEY_URL_UPLOAD, files=files, data=data, headers=headers)

    if response.status_code in [200, 201]:
        os.remove(wire_zip)
        print 'Uploaded!'
    else:
        print 'Error :(', response.status_code
