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
import zipfile

HOCKEY_APP_ID = os.environ.get('WIN_PROD_HOCKEY_ID')
HOCKEY_TOKEN = os.environ.get('WIN_PROD_HOCKEY_TOKEN')
VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]

HOCKEY_BASE_URL = 'https://rink.hockeyapp.net/api/2/apps/{APP_ID}'.format(HOCKEY_APP_ID)
HOCKEY_URL_NEW = '{BASE_URL}/app_versions/new'.format(HOCKEY_BASE_URL)
HOCKEY_URL_UPDATE = '{BASE_URL}/app_versions/'.format(HOCKEY_BASE_URL)

bin_root = os.path.dirname(os.path.realpath(__file__))
wire_exe = os.path.join(bin_root, '..', 'wrap', 'prod', 'Wire-win32-ia32', 'WireSetup.exe')
wire_zip = os.path.join(bin_root, 'WireSetup.zip')


def zipit(source, dest):
    os.chdir(os.path.dirname(os.path.abspath(source)))
    filename = os.path.basename(source)
    zipf = zipfile.ZipFile(dest, 'w')
    zipf.write(filename)
    zipf.close()


if __name__ == '__main__':
    print 'Compressing...'
    zipit(wire_exe, wire_zip)

    print 'Uploading Wire for Windows ({VERSION})...'.format(VERSION)
    semver_version = VERSION.split('.')

    headers = {'X-HockeyAppToken': HOCKEY_TOKEN}
    data = {
        'bundle_short_version': '{MAJOR}.{MINOR}'.format(MAJOR=semver_version[0], MINOR=semver_version[1]),
        'bundle_version': semver_version[2],
        'notes': 'New build of Wire for Windows ({VERSION})'.format(VERSION),
        'notify': 0,
        'status': 2,
    }
    files = {'ipa': open(wire_zip, 'rb')}

    response = requests.post(HOCKEY_URL_NEW, data=data, headers=headers)
    response = requests.put('{URL}{VERSION_ID}'.format(URL=HOCKEY_URL_UPDATE, VERSION_ID=response.json()['id']), files=files, data=data, headers=headers)

    if response.status_code in [200, 201]:
        print 'Uploaded!'
    else:
        print 'Error :(', response.status_code
